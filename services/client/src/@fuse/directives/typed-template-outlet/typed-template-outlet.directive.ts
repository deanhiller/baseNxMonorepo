import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * Provides type safety for ng-template contexts used with ngTemplateOutlet.
 *
 * Without this directive, `let-trainer` in `<ng-template let-trainer>` is typed as `any`,
 * so Angular's template type-checker cannot catch property errors.
 *
 * Usage:
 * 1. In component class, expose the DTO class:
 *    protected readonly UserTrainerDto = UserTrainerDto;
 *
 * 2. In template, bind the class to [templateClassType]:
 *    <ng-template #details let-trainer [templateClassType]="UserTrainerDto">
 *        {{ trainer.user?.firstName }}  <!-- now type-checked! -->
 *    </ng-template>
 */

interface TemplateOutletContext<T> {
    $implicit: T;
}

// webpieces-disable no-any-unknown -- constructor type requires any[] per TypeScript convention
type Constructor<T> = new (...args: any[]) => T;

@Directive({
    selector: 'ng-template[templateClassType]',
    standalone: true,
})
export class TypedTemplateOutletDirective<T> {
    @Input() templateClassType!: Constructor<T>;

    constructor(public templateRef: TemplateRef<TemplateOutletContext<T>>) {}

    // webpieces-disable no-any-unknown -- ngTemplateContextGuard requires unknown per Angular API
    static ngTemplateContextGuard<T>(
        _dir: TypedTemplateOutletDirective<T>,
        _ctx: unknown
    ): _ctx is TemplateOutletContext<T> {
        return true;
    }
}
