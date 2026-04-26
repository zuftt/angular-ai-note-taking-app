import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Folder, ApiResponse } from '../models/types';

@Injectable({ providedIn: 'root' })
export class FolderService {
  private apiUrl = 'http://localhost:3000/api/folders';

  constructor(private http: HttpClient) {}

  getTree(): Observable<ApiResponse<Folder[]>> {
    return this.http.get<ApiResponse<Folder[]>>(`${this.apiUrl}/tree`);
  }

  createFolder(folder: Partial<Folder>): Observable<ApiResponse<Folder>> {
    return this.http.post<ApiResponse<Folder>>(this.apiUrl, folder);
  }

  updateFolder(id: string, folder: Partial<Folder>): Observable<ApiResponse<Folder>> {
    return this.http.put<ApiResponse<Folder>>(`${this.apiUrl}/${id}`, folder);
  }

  deleteFolder(id: string, moveToParent = false): Observable<ApiResponse<{ deletedId: string }>> {
    return this.http.delete<ApiResponse<{ deletedId: string }>>(`${this.apiUrl}/${id}`, {
      body: { moveToParent },
    });
  }
}
