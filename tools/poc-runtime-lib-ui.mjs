// Isolated experiment: never deploys or modifies tracked app source permanently.
import { readFile, writeFile, mkdir, cp, rm, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
const run = (...args) => execFileSync('npx', args, { stdio: 'inherit', env: {...process.env, NX_NO_CLOUD:'true', NX_DAEMON:'false'} });
const json = async p => JSON.parse(await readFile(p,'utf8'));
const put = (p,v) => writeFile(p, JSON.stringify(v,null,2));
const root = 'dist/angular-github-actions/browser';
const card = 'libs/lib-ui/src/lib/card.ts';
const angular = await readFile('angular.json','utf8');
const original = await readFile(card,'utf8');
const core = 'libs/lib-core/src/lib/workspace-state.ts';
const state = 'libs/lib-state/src/lib/posts.store.ts';
const originalCore = await readFile(core,'utf8');
const originalState = await readFile(state,'utf8');
const provider = 'apps/poc-ui-provider';
const hash = async (dir) => {
 const out = {};
 async function walk(d) { for (const e of await readdir(d,{withFileTypes:true})) {
 const p=join(d,e.name); if(e.isDirectory()) await walk(p);
 else if(/\.(m?js)$/.test(p)) out[p]=createHash('sha256').update(await readFile(p)).digest('hex');
 }}
 await walk(dir); return out;
};
let server, browser;
try {
 run('nx','run-many','-t','build','--projects=host,mfe1,mfe2','--configuration=pages','--skip-nx-cache');
 execFileSync('node',['tools/package-pages.mjs'],{stdio:'inherit'});
 const before=await hash(root);
 const {spawn}=await import('node:child_process');
 server=spawn(process.execPath,['tools/preview-pages.mjs'],{stdio:'inherit'});
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4400/angular-github-actions/cit/')).ok) break;}catch{} await new Promise(r=>setTimeout(r,500));}
 browser=await chromium.launch();
 const verify=async expected=>{
  const page=await browser.newPage();
  try {
   for(const route of ['', 'mfe1/', 'mfe2/']){
    await page.goto('http://127.0.0.1:4400/angular-github-actions/cit/'+route);
    const cards=page.locator('app-ui-card .card');
    const count=route?2:1;
    await cards.nth(count-1).waitFor();
    assert.equal(await cards.count(),count);
    for(const el of await cards.all()) assert.equal(await el.evaluate(e=>getComputedStyle(e).backgroundColor),expected);
   }
  }finally{await page.close();}
 };
 const verifyState = async (increment, postTitle) => {
  const context = await browser.newContext();
  let requests = 0;
  await context.route('https://jsonplaceholder.typicode.com/posts*', async route => {
   requests++;
   await route.fulfill({json:[{userId:1,id:1,title:'POC post',body:'mock'}]});
  });
  const page = await context.newPage();
  const base='http://127.0.0.1:4400/angular-github-actions/cit/';
  const expectText = async (locator,value) => {
   await locator.waitFor();
   for(let i=0;i<100;i++){
    if((await locator.innerText()).trim()===String(value)) return;
    await page.waitForTimeout(50);
   }
   assert.equal((await locator.innerText()).trim(),String(value));
  };
  try {
   await page.goto(base);
   await page.getByRole('link',{name:'MFE 1 · Products'}).click();
   await page.getByRole('button',{name:'Add item'}).first().click();
   await expectText(page.getByTestId('host-count'),increment);
   await page.locator('#mfe1-filter').fill('only-one');
   await page.getByRole('button',{name:'Load sample posts'}).click();
   await expectText(page.getByTestId('shared-post-count'),1);
   await page.getByText(postTitle,{exact:true}).waitFor();
   await page.getByRole('link',{name:'MFE 2 · Selection'}).click();
   await expectText(page.getByTestId('selection-count'),increment);
   await expectText(page.getByTestId('mfe2-shared-post-count'),1);
   await page.getByText(postTitle,{exact:true}).waitFor();
   assert.equal(await page.locator('#mfe2-filter').inputValue(),'');
   await page.getByRole('button',{name:'Load or reuse posts'}).click();
   await expectText(page.getByTestId('mfe2-shared-post-count'),1);
   assert.equal(requests,1,'Shared cache should avoid a second HTTP request');
   await page.getByRole('button',{name:'Clear selection'}).click();
   await expectText(page.getByTestId('host-count'),0);
  }finally{await context.close();}
 };
 await verify('rgb(242, 242, 242)');
 await verifyState(1,'POC post');
 // Generate a minimal temporary Angular federation provider, not an existing consumer.
 await mkdir(provider+'/src',{recursive:true});
 await writeFile(provider+'/src/main.ts',"import { Card } from '@workspace/lib-ui';\nimport { WorkspaceState } from '@workspace/lib-core';\nimport { PostsStore, MfeLocalStore } from '@workspace/lib-state';\nconsole.log('Runtime library provider', Card, WorkspaceState, PostsStore, MfeLocalStore);\n");
 await writeFile(provider+'/src/index.html','<!doctype html><html><head><base href="/"></head><body></body></html>');
 await put(provider+'/tsconfig.app.json',{extends:'../../tsconfig.json',compilerOptions:{types:[]},include:['src/**/*.ts']});
 await put(provider+'/tsconfig.federation.json',{extends:'./tsconfig.app.json',include:['src/**/*.d.ts']});
 await writeFile(provider+'/federation.config.mjs',"import { federationConfig } from '../../tools/federation.config.mjs';\nexport default federationConfig('poc-ui-provider', {});\n");
 const workspace=JSON.parse(angular);
 workspace.projects['poc-ui-provider']={projectType:'application',root:provider,sourceRoot:provider+'/src',architect:{
 esbuild:{builder:'@angular/build:application',options:{browser:provider+'/src/main.ts',index:provider+'/src/index.html',tsConfig:provider+'/tsconfig.app.json',outputPath:'dist/poc-ui-provider',polyfills:['es-module-shims']}},
 build:{builder:'@angular-architects/native-federation:build',options:{target:'poc-ui-provider:esbuild',tsConfig:provider+'/tsconfig.federation.json',cacheExternalArtifacts:false}}
 }};
 await put('angular.json',workspace);
 assert.ok(original.includes('#f2f2f2'));
 await writeFile(card,original.replace('#f2f2f2','#d1fae5'));
 assert.ok(originalCore.includes('count + 1'));
 await writeFile(core,originalCore.replace('count + 1','count + 2'));
 const loader='this.http.get<DemoPost[]>(URL)';
 assert.ok(originalState.includes(loader));
 await writeFile(state,originalState.replace(loader,"this.http.get<DemoPost[]>(URL).pipe(map(posts => posts.map(post => ({ ...post, title: post.title + ' [runtime v2]' }))))").replace("import { HttpClient } from '@angular/common/http';","import { HttpClient } from '@angular/common/http';\nimport { map } from 'rxjs';"));
 run('ng','run','poc-ui-provider:build');
 const donor='dist/poc-ui-provider/browser';
 const entry=await json(donor+'/remoteEntry.json');
 const originalHostEntry=await readFile(root+'/remoteEntry.json','utf8');
 const hostEntry=JSON.parse(originalHostEntry);
 await cp(donor,root+'/poc-ui-v2',{recursive:true});
 // State may be provided by a remote rather than the shell. Redirect every existing
 // metadata record for these mappings to the same independently built artifact.
 const metadataPaths=[root+'/remoteEntry.json',...['mfe1','mfe2'].map(m=>root+'/remotes/'+m+'/remoteEntry.json')];
 const originals=new Map();
 for(const p of metadataPaths) originals.set(p,await readFile(p,'utf8'));
 for(const name of ['@workspace/lib-ui','@workspace/lib-core','@workspace/lib-state']){
  const next=entry.shared.find(x=>x.packageName===name);
  assert.ok(next?.outFileName,'Provider mapping missing: '+name);
  let found=0;
  for(const p of metadataPaths){
   const meta=await json(p);
   const old=meta.shared.find(x=>x.packageName===name);
   if(!old) continue;
   assert.equal(next.version,old.version,'Same-contract replacement only');
   old.outFileName=(p===metadataPaths[0]?'':'../../')+'poc-ui-v2/'+next.outFileName;
   await put(p,meta); found++;
  }
  assert.ok(found,'Consumer mapping missing: '+name);
 }

 // Prove every original consumer JS file is byte-for-byte unchanged.
 const after=await hash(root);
 for(const [p,h] of Object.entries(before)) assert.equal(after[p],h,p);
 await verify('rgb(209, 250, 229)');
 await verifyState(2,'POC post [runtime v2]');
 console.log('PASS: updated core singleton and state cache work across old consumers.');
 console.log('PASS: host and both remotes render updated UI without rebuilding consumer JS.');
 // Rollback by restoring metadata and verify a fresh browser page.
 for(const [p,contents] of originals) await writeFile(p,contents);
 await verify('rgb(242, 242, 242)');
 await verifyState(1,'POC post');
 console.log('PASS: metadata rollback restores original UI.');
} finally {
 await browser?.close(); server?.kill();
 await writeFile(card,original); await writeFile(core,originalCore); await writeFile(state,originalState); await writeFile('angular.json',angular);
 await rm(provider,{recursive:true,force:true});
}
