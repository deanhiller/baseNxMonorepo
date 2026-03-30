import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { ProjectComponent } from 'app/modules/admin/dashboards/project/project.component';
import { ProjectService } from 'app/modules/admin/dashboards/project/project.service';
import { GreetService } from 'app/modules/admin/dashboards/project/greet.service';

export default [
    {
        path: '',
        component: ProjectComponent,
        providers: [GreetService],
        resolve: {
            data: () => inject(ProjectService).getData(),
            greeting: () => inject(GreetService).fetchGreeting('Dean'),
        },
    },
] as Routes;
