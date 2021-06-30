import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Message } from '../models/Message';

@Injectable()
export class MessagesService {
    apiUrl = 'http://localhost:8080/api/message/';

    messages: Message[];
    messagesSubject = new Subject<Message[]>();

    constructor(private httpClient: HttpClient) { }

    emitMessages(): void{
        this.messagesSubject.next(this.messages);
    }
    getMessages(): Observable<Message[]>{
        return this.httpClient.get<Message[]>(this.apiUrl, {observe: "body"});
    }

    updateMessage(message: Message): Observable<Message>{
        return this.httpClient.patch<Message>(this.apiUrl + message.id, message);
    }
    postNewMessage(message: Message): Observable<Message> {
        return this.httpClient.post<Message>(this.apiUrl, message);
    }

    deleteMessage(message: Message): Observable<Message>{
        return this.httpClient.delete<Message>(this.apiUrl + message.id)
    }
}