import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Message } from 'src/app/models/Message';
import { Topic } from 'src/app/models/Topic';
import { User } from 'src/app/models/User';
import { MessagesService } from 'src/app/services/MessagesService';
import { TopicsService } from 'src/app/services/TopicsService';
import { UsersService } from 'src/app/services/UsersService';
import { DialogConfirmComponent } from 'src/app/dialogs/dialog-confirm.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'topic',
    templateUrl: './topic.component.html',
    styleUrls: ['./topic.component.css']
})
export class TopicComponent implements OnInit, OnDestroy {
    form: FormGroup;

    topic: Topic;
    topicSubscription: Subscription;

    connectedUser: User;
    connectedUserSubscription: Subscription;

    dialogRefSubscription: Subscription;
    editMessage: FormControl;

    constructor(
        private formBuilder: FormBuilder,
        private usersService: UsersService,
        private topicsService: TopicsService,
        private messagesService: MessagesService,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    onChangeEditedMessage(message: Message): void {

    }
    onEditMessage(message: Message): void {

    }
    ngOnInit(): void {
        this.usersService.emitConnectedUser();
        this.topicSubscription = this.topicsService.getTopic(this.route.snapshot.params['id']).subscribe((topic: Topic) => {
            topic.date = new Date(topic.date);

            topic.messages = topic.messages.map((message: Message) => {
                message.date = new Date(message.date);
                return message;
            });

            this.topic = topic;
        });

        this.form = this.formBuilder.group({
            content: ['', [Validators.minLength(5), Validators.maxLength(3000)]],
        });

        this.usersService.connectedUserSubject.subscribe((user: User) => {
            this.connectedUser = user;
        });

        this.connectedUser = JSON.parse(localStorage.getItem("connectedUser")!)

    }

    onRefreshMessages(): void {
        this.topicsService.getTopic(this.topic.id!).subscribe((topic: Topic) => {
            topic.date = new Date(topic.date);

            topic.messages = topic.messages.map((message: Message) => {
                message.date = new Date(message.date);
                return message;
            });

            this.topic = topic;
            this.snackBar.open('Messages actualisés', 'Fermer', { duration: 3000 });
        }, error => {
            this.snackBar.open('Une erreur est survenue lors de l\'actualisation des messages', 'Fermer', { duration: 3000 });
        });
    }

    onSubmit(): void {
        if (this.form.valid) {
            const message: Message = {
                content: this.form.value.content,
                date: new Date().getTime(),
                author: this.connectedUser,
                topic: this.topic
            }

            this.messagesService.postNewMessage(message).subscribe((message: Message) => {
                this.topicsService.getTopic(this.topic.id!).subscribe((topic: Topic) => {
                    topic.date = new Date(topic.date);

                    topic.messages = topic.messages.map((message: Message) => {
                        message.date = new Date(message.date);
                        return message;
                    });

                    this.topic = topic;
                    this.topicsService.emitTopics();

                    this.snackBar.open('Votre message a bien été envoyé', 'Fermer', { duration: 3000 });

                    this.form.reset();

                    Object.keys(this.form.controls).forEach(formControlName => {
                        this.form.controls[formControlName].setErrors(null);
                    });
                });
            }, error => {
                this.snackBar.open('Une erreur est survenue. Veuillez vérifier votre saisie', 'Fermer', { duration: 3000 });
            });
        }
    }

    deleteMessage(message: Message): void {
        const dialogRef = this.dialog.open(DialogConfirmComponent, {
            data: {
                title: 'Êtes-vous sûr de vouloir supprimer ce message ?',
                content: 'Cette action est irréversible.',
                action: 'Supprimer'
            },
            autoFocus: false
        });

        this.dialogRefSubscription = dialogRef.afterClosed().subscribe(confirm => {
            if (confirm) {
                this.messagesService.deleteMessage(message).subscribe(response => {

                    this.snackBar.open('Le message a bien été supprimé', 'Fermer', { duration: 3000 });
                    this.messagesService.emitMessages();
                    this.onRefreshMessages();
                }, error => {
                    this.snackBar.open('Une erreur est survenue. Veuillez vérifier votre saisie', 'Fermer', { duration: 3000 });
                });
            }
        });
    }
    ngOnDestroy(): void {
        if (this.connectedUserSubscription) {
            this.connectedUserSubscription.unsubscribe();
        }

        if (this.topicSubscription) {
            this.topicSubscription.unsubscribe();
        }
    }

    getErrorMessage(formControlName: string): string | void {
        if (this.form.controls[formControlName].hasError('required')) {
            return 'Ce champ est obligatoire';
        }

        if (this.form.controls[formControlName].hasError('minlength')) {
            return 'Vous devez entrer au moins ' + this.form.controls[formControlName].getError('minlength').requiredLength + ' caractères';
        }

        if (this.form.controls[formControlName].hasError('maxlength')) {
            return 'Vous ne pouvez pas entrer plus de ' + this.form.controls[formControlName].getError('maxlength').requiredLength + ' caractères';
        }
    }
}
