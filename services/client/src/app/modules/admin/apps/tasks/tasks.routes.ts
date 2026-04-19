import { inject } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    Router,
    RouterStateSnapshot,
    Routes,
} from '@angular/router';
import { TasksDetailsComponent } from 'app/modules/admin/apps/tasks/details/details.component';
import { TasksListComponent } from 'app/modules/admin/apps/tasks/list/list.component';
import { TasksComponent } from 'app/modules/admin/apps/tasks/tasks.component';
import { Task } from 'app/modules/admin/apps/tasks/tasks.types';
import { TasksService } from 'app/modules/admin/apps/tasks/tasks.service';
import { Observable, catchError, throwError } from 'rxjs';

/**
 * Task resolver
 *
 * @param route
 * @param state
 */
const taskResolver = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Observable<Task> => {
    const tasksService = inject(TasksService);
    const router = inject(Router);

    // 'id' is part of the route definition and always present here
    return tasksService.getTaskById(route.paramMap.get('id')!).pipe(
        // Error here means the requested task is not available
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

/**
 * Can deactivate tasks details
 *
 * @param component
 * @param currentRoute
 * @param currentState
 * @param nextState
 */
const canDeactivateTasksDetails = (
    component: TasksDetailsComponent,
    _currentRoute: ActivatedRouteSnapshot,
    _currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot
): boolean | Promise<boolean> => {
    // Get the next route
    let nextRoute: ActivatedRouteSnapshot = nextState.root;
    while (nextRoute.firstChild) {
        nextRoute = nextRoute.firstChild;
    }

    // If the next state doesn't contain '/tasks'
    // it means we are navigating away from the
    // tasks app
    if (!nextState.url.includes('/tasks')) {
        // Let it navigate
        return true;
    }

    // If we are navigating to another task...
    if (nextRoute.paramMap.get('id')) {
        // Just navigate
        return true;
    }

    // Otherwise, close the drawer first, and then navigate
    return component.closeDrawer().then(() => true);
};

export default [
    {
        path: '',
        component: TasksComponent,
        resolve: {
            tags: () => inject(TasksService).getTags(),
        },
        children: [
            {
                path: '',
                component: TasksListComponent,
                resolve: {
                    tasks: () => inject(TasksService).getTasks(),
                },
                children: [
                    {
                        path: ':id',
                        component: TasksDetailsComponent,
                        resolve: {
                            task: taskResolver,
                        },
                        canDeactivate: [canDeactivateTasksDetails],
                    },
                ],
            },
        ],
    },
] as Routes;
