import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export interface JsonPlaceholderPost {
  userId: number;
  id: number;
  title: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class JsonPlaceholderService {
  private readonly http = inject(HttpClient);

  getPosts() {
    return this.http.get<JsonPlaceholderPost[]>(
      'https://jsonplaceholder.typicode.com/posts?_limit=5',
    );
  }
}
