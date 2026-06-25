/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AttachmentMetadata } from '../types';

// Simple IndexedDB Wrapper representing a "dedicated application media folder"
export class AttachmentStorageService {
  private static DB_NAME = 'alkhazina_media_folder';
  private static STORE_NAME = 'attachments';
  private static DB_VERSION = 1;

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (e) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  // Save a file to the virtual "folder" (IndexedDB) and return its metadata
  public static async saveAttachment(file: File): Promise<AttachmentMetadata> {
    const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const base64Data = await this.fileToBase64(file);
    
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(base64Data, id);
      
      request.onsuccess = () => {
        resolve({
          id,
          name: file.name,
          size: file.size,
          type: file.type
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get raw base64 data for an attachment
  public static async getAttachmentData(id: string): Promise<string> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          reject(new Error(`Attachment not found: ${id}`));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Delete an attachment from the virtual "folder"
  public static async deleteAttachment(id: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Export all attachments in the "folder" as a map of ID -> Base64 string
  public static async exportAll(): Promise<Record<string, string>> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const map: Record<string, string> = {};
      
      const request = store.openCursor();
      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          map[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(map);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Import attachments into the virtual "folder", overwriting/replacing existing ones
  public static async importAll(attachmentsMap: Record<string, string>): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      // Clear existing first
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        const keys = Object.keys(attachmentsMap);
        if (keys.length === 0) {
          resolve();
          return;
        }
        
        let completed = 0;
        let errored = false;
        
        for (const key of keys) {
          const putRequest = store.put(attachmentsMap[key], key);
          putRequest.onsuccess = () => {
            completed++;
            if (completed === keys.length && !errored) {
              resolve();
            }
          };
          putRequest.onerror = (e) => {
            if (!errored) {
              errored = true;
              reject(putRequest.error);
            }
          };
        }
      };
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  // Helper: File to Base64
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  public static async clearAll(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
