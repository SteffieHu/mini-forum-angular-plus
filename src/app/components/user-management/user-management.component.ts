import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from 'src/app/models/User';
import { UsersService } from 'src/app/services/UsersService';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { DialogConfirmComponent } from 'src/app/dialogs/dialog-confirm.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {

  form: FormGroup;
  filterControl: FormControl;

  connectedUser: User;
  connectedUserSubscription: Subscription;

  users: User[] = [];
  filteredUsers: User[] = [];
  usersSubscription: Subscription;

  editedUser?: User;
  editUserControl: FormControl;

  dialogRefSubscription: Subscription;

  roleAdmin: FormControl;

 

  constructor(
    private formBuilder: FormBuilder,
    private usersService: UsersService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.usersService.emitConnectedUser();
    this.usersService.emitUsers();
    this.usersService.getUsers();

    this.usersSubscription=this.usersService.getUsers().subscribe((users: User[]) => {
      this.users = users;
      this.filteredUsers=users;
      
    });
    
    this.editUserControl=this.formBuilder.control(["",[Validators.minLength(5), Validators.maxLength(50)]]);
    this.roleAdmin=this.formBuilder.control(false);

    this.connectedUser= JSON.parse(localStorage.getItem("connectedUser")!);
    
  }

  onChangeEditedUser(user: User): void {
    this.editedUser = (this.editedUser === user) ? undefined : user;
    this.editUserControl.setValue(user.username);
    this.roleAdmin.setValue(user.admin? true:false);

    }
   

  onEditUser(user: User): void {
    user.username=this.editUserControl.value  
    user.connectedUser=this.connectedUser;

    if(this.roleAdmin.value===true){
      user.isAdmin=true;
      user.admin=true;
    } else if (this.roleAdmin.value===false){
      user.isAdmin=false;
      user.admin=false;
    }

    if (this.editUserControl.valid) {     
      this.usersService.updateUser(user).subscribe((user: User) => {
        this.usersService.users = this.usersService.users.map((userElt: User) => {
          if (userElt.id === user.id) {
            console.log("AAAA"+user);
            userElt.username = user.username;
            userElt.password=user.password;
            userElt.passwordConfirm=user.passwordConfirm;
            userElt.oldPassword=user.oldPassword;
            userElt.isAdmin=user.isAdmin;
            console.log(user.isAdmin);
            console.log(userElt.isAdmin);
            userElt.connectedUser=this.connectedUser;  
          }
        
          return userElt;
        });

        this.usersService.emitUsers();
        this.snackBar.open('Le user a bien été modifié', 'Fermer', { duration: 3000 });
        this.editedUser = undefined;

      }, error => {
        this.snackBar.open('Une erreur est survenue. Veuillez vérifier votre saisie', 'Fermer', { duration: 3000 });
      });
    }
  }

  onDeleteUser(user: User): void {
    const dialogRef = this.dialog.open(DialogConfirmComponent, {
      data: {
        title: 'Êtes-vous sûr de vouloir supprimer ce user ?',
        content: 'Cette action est irréversible.',
        action: 'Supprimer'
      },
      autoFocus: false
    });

    this.dialogRefSubscription = dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.usersService.deleteUser(user).subscribe(response => {
          this.usersService.users = this.usersService.users.filter(userElt => userElt.id !== user.id);

          
          
          this.snackBar.open('Le sujet a bien été supprimé', 'Fermer', { duration: 3000 });
          this.usersService.emitUsers();
          this.editedUser = undefined;
        }, error => {
          this.snackBar.open('Une erreur est survenue. Veuillez vérifier votre saisie', 'Fermer', { duration: 3000 });
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dialogRefSubscription) {
      this.dialogRefSubscription.unsubscribe();
    }

    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
    }
  }
}
