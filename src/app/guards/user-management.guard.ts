import { importType } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router,  RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from '../models/User';
import { UsersService } from '../services/UsersService';
import { MatSnackBar } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root'
})
export class UserManagementGuard implements CanActivate {
  constructor(
    private usersService: UsersService,
    private router: Router,
    private snackBar: MatSnackBar
) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return new Observable(observer=>{
      this.usersService.connectedUserSubject.subscribe((user: User)=> {
         
        if (user.admin===true || user.isAdmin===true) {
          observer.next(true);
        } else {
          this.snackBar.open('Vous n\'avez pas les accès', 'Fermer', { duration: 3000 });
          observer.next(this.router.parseUrl(''));
        }
        observer.complete();
      });
      this.usersService.emitConnectedUser();
    });
  }
  
}
