import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { FuseHighlightComponent } from '@fuse/components/highlight';
import { FuseMasonryComponent } from '@fuse/components/masonry';
import { TypedTemplateOutletDirective } from '@fuse/directives/typed-template-outlet/typed-template-outlet.directive';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseComponentsComponent } from 'app/modules/admin/ui/fuse-components/fuse-components.component';
import { Subject, takeUntil } from 'rxjs';

/* Runtime shape of a single column emitted by FuseMasonryComponent's columnsTemplate
 * in this demo; the demo passes `[items]="[1, 2, 3, ...]"`. */
type MasonryDemoColumns = Array<{ items: number[] }>;

@Component({
    selector: 'masonry',
    templateUrl: './masonry.component.html',
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        FuseHighlightComponent,
        MatTabsModule,
        FuseMasonryComponent,
        TypedTemplateOutletDirective,
    ],
})
export class MasonryComponent implements OnInit {
    columns: number = 4;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // webpieces-disable no-any-unknown -- FuseMasonryComponent declares columnsTemplate as TemplateRef<any>; cast narrows let-columns to the demo's runtime shape
    protected readonly MasonryDemoColumnsCtor =
        Object as unknown as new () => MasonryDemoColumns;

    /**
     * Constructor
     */
    constructor(
        private _fuseComponentsComponent: FuseComponentsComponent,
        private _fuseMediaWatcherService: FuseMediaWatcherService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({ matchingAliases }) => {
                // Set the masonry columns
                //
                // This if block structured in a way so that only the
                // biggest matching alias will be used to set the column
                // count.
                if (matchingAliases.includes('xl')) {
                    this.columns = 5;
                } else if (matchingAliases.includes('lg')) {
                    this.columns = 4;
                } else if (matchingAliases.includes('md')) {
                    this.columns = 3;
                } else if (matchingAliases.includes('sm')) {
                    this.columns = 2;
                } else {
                    this.columns = 1;
                }
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle the drawer
     */
    toggleDrawer(): void {
        // Toggle the drawer
        this._fuseComponentsComponent.matDrawer.toggle();
    }
}
