import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page, ApiResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class PageService {
  private apiUrl = 'http://localhost:3000/api/pages';

  constructor(private http: HttpClient) {}

  getTree(folderId?: string | null): Observable<ApiResponse<Page[]>> {
    if (folderId !== undefined) {
      return this.http.get<ApiResponse<Page[]>>(`${this.apiUrl}/tree?folderId=${folderId ?? 'null'}`);
    }
    return this.http.get<ApiResponse<Page[]>>(`${this.apiUrl}/tree`);
  }

  getPages(parentId?: string | null): Observable<ApiResponse<Page[]>> {
    const url = parentId ? `${this.apiUrl}?parentId=${parentId}` : this.apiUrl;
    return this.http.get<ApiResponse<Page[]>>(url);
  }

  getPage(id: string): Observable<ApiResponse<Page>> {
    return this.http.get<ApiResponse<Page>>(`${this.apiUrl}/${id}`);
  }

  createPage(page: Partial<Page>): Observable<ApiResponse<Page>> {
    return this.http.post<ApiResponse<Page>>(this.apiUrl, page);
  }

  updatePage(id: string, page: Partial<Page>): Observable<ApiResponse<Page>> {
    return this.http.put<ApiResponse<Page>>(`${this.apiUrl}/${id}`, page);
  }

  deletePage(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  movePage(id: string, parentId: string | null): Observable<ApiResponse<Page>> {
    return this.http.post<ApiResponse<Page>>(`${this.apiUrl}/${id}/move`, { parentId });
  }

  searchPages(query: string): Observable<ApiResponse<Page[]>> {
    return this.http.get<ApiResponse<Page[]>>(`${this.apiUrl}/search?query=${encodeURIComponent(query)}`);
  }
}
