import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { HttpClient } from '@angular/common/http';
import { ROUTES } from 'src/app/routes';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private router: Router,
  ) {}

  // AUTHENTICATION

  logOut() {
    this.storageService.delete('user');
    this.storageService.delete('token');
    this.storageService.delete('user');
    this.router.navigate(['/', ROUTES.login]);
  }

  async login(email: string, password: string) {
    if (email && password) {
      this.storageService.save('user', email);
    }
    const r = await this.http
      .post<{ token: string }>(
        this.apiUrl + '/users/login',
        { email, password },
        {
          headers: {
            Authorization: 'Basic ' + btoa(email + ':' + password),
          },
        },
      )
      .toPromise()
      .catch(() => {
        window.alert('Credenciales incorrectas');
        return null;
      });
    if (r !== null) {
      this.storageService.save('token', r.token);
      this.storageService.save('user', JSON.stringify(r.user));
      this.redirectToStartPage();
    }
  }

  redirectToStartPage() {
    this.router.navigateByUrl(`${ROUTES.getStartPage}`);
  }

  authenticatedUser(): any {
    return JSON.parse(this.storageService.get('user'));
  }

  me() {
    return this.http.get(`${this.apiUrl}/users/me`, {
      headers: this.getHeaders(),
    });
  }

  // CRUD
  get(endpoint: string, parameters: { [prop: string]: string | string[] }) {
    return this.http.get<any>(`${this.apiUrl}/${endpoint}`, {
      params: parameters,
      headers: this.getHeaders(),
    });
  }

  getBuffer(
    endpoint: string,
    parameters: { [prop: string]: string | string[] },
  ) {
    const options: any = {
      params: parameters,
      responseType: 'blob',
      headers: this.getHeaders(),
    };
    return this.http.get(`${this.apiUrl}/${endpoint}`, { ...options });
  }

  post(
    endpoint: string,
    parameters: { [prop: string]: string | string[] },
    cuerpo: any,
  ) {
    return this.http.post<any>(`${this.apiUrl}/${endpoint}`, cuerpo, {
      params: parameters,
      headers: this.getHeaders(),
    });
  }

  delete(endpoint: string, parameters: { [prop: string]: string | string[] }) {
    return this.http.delete<any>(`${this.apiUrl}/${endpoint}`, {
      params: parameters,
      headers: this.getHeaders(),
    });
  }

  patch(
    endpoint: string,
    parameters: { [prop: string]: string | string[] },
    cuerpo: any,
  ) {
    return this.http.patch<any>(`${this.apiUrl}/${endpoint}`, cuerpo, {
      params: parameters,
      headers: this.getHeaders(),
    });
  }

  getHeaders() {
    return {
      'content-type': 'application/json',
      Authorization: 'Bearer ' + this.storageService.get('token'),
    };
  }
}
