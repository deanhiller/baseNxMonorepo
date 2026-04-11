import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from 'app/app.component';
import { appConfig } from 'app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
    // eslint-disable-next-line no-console -- bootstrap failure before any logger/DI is available
    console.error(err)
);
