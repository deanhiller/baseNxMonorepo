import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
    Routes,
} from '@angular/router';
import { ChatComponent } from 'app/modules/admin/apps/chat/chat.component';
import { ChatService } from 'app/modules/admin/apps/chat/chat.service';
import { ChatsComponent } from 'app/modules/admin/apps/chat/chats/chats.component';
import { ConversationComponent } from 'app/modules/admin/apps/chat/conversation/conversation.component';
import { EmptyConversationComponent } from 'app/modules/admin/apps/chat/empty-conversation/empty-conversation.component';
import { Observable, catchError, throwError } from 'rxjs';

/**
 * Conversation resolver
 *
 * @param route
 * @param state
 */
const conversationResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
    // webpieces-disable no-any-unknown -- getChatById returns Observable<any> in the service; keep that contract
): Observable<any> => {
    const chatService = inject(ChatService);
    const router = inject(Router);

    // 'id' is part of the route definition and always present here
    return chatService.getChatById(route.paramMap.get('id')!).pipe(
        // Error here means the requested chat is not available
        catchError((error) => {

            // Get the parent url
            const parentUrl = state.url.split('/').slice(0, -1).join('/');

            // Navigate to there
            router.navigateByUrl(parentUrl);

            // Throw an error
            return throwError(error);
        })
    );
};

export default [
    {
        path: '',
        component: ChatComponent,
        resolve: {
            chats: () => inject(ChatService).getChats(),
            contacts: () => inject(ChatService).getContacts(),
            profile: () => inject(ChatService).getProfile(),
        },
        children: [
            {
                path: '',
                component: ChatsComponent,
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        component: EmptyConversationComponent,
                    },
                    {
                        path: ':id',
                        component: ConversationComponent,
                        resolve: {
                            conversation: conversationResolver,
                        },
                    },
                ],
            },
        ],
    },
] as Routes;
