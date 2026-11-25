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
 await verify('rgb(242, 242, 242)');
 // Generate a minimal temporary Angular federation provider, not an existing consumer.
 await mkdir(provider+'/src',{recursive:true});
 await writeFile(provider+'/src/main.ts',"import { Card } from '@workspace/lib-ui';\nconsole.log('Runtime UI provider', Card);\n");
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
 run('ng','run','poc-ui-provider:build');
 const donor='dist/poc-ui-provider/browser';
 const entry=await json(donor+'/remoteEntry.json');
 const originalHostEntry=await readFile(root+'/remoteEntry.json','utf8');
 const hostEntry=JSON.parse(originalHostEntry);
 const findUi=e=>e.shared.find(x=>x.packageName==='@workspace/lib-ui');
 console.log('Host UI metadata:',findUi(hostEntry),'Provider UI metadata:',findUi(entry));
 const old=findUi(hostEntry), next=findUi(entry);
 assert.ok(old?.outFileName && next?.outFileName,'UI mapping not present in federation metadata');
 assert.equal(next.version,old.version,'This experiment tests same-contract replacement only');
 await cp(donor,root+'/poc-ui-v2',{recursive:true});
 old.outFileName='poc-ui-v2/'+next.outFileName;
 await put(root+'/remoteEntry.json',hostEntry);
 // Prove every original consumer JS file is byte-for-byte unchanged.
 const after=await hash(root);
 for(const [p,h] of Object.entries(before)) assert.equal(after[p],h,p);
 await verify('rgb(209, 250, 229)');
 console.log('PASS: host and both remotes render updated UI without rebuilding consumer JS.');
 // Rollback by restoring metadata and verify a fresh browser page.
 await writeFile(root+'/remoteEntry.json',originalHostEntry);
 await verify('rgb(242, 242, 242)');
 console.log('PASS: metadata rollback restores original UI.');
} finally {
 await browser?.close(); server?.kill();
 await writeFile(card,original); await writeFile('angular.json',angular);
 await rm(provider,{recursive:true,force:true});
}
