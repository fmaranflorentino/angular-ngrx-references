## NgRx

### Instalation

- `ng add @ngrx/store`

- `ng add @ngrx/store-devtools`

### Configuring an NgRx Feature Module using NgRx Schematics

- `ng g store auth/Auth --module auth.module.ts`

### Dispatching actions

Create a `auth.actions.ts` with the following content

```ts
import { createAction, props } from "@ngrx/store";
import { User } from "./model/user.model";

export const login = createAction("@auth/LOGIN", props<{ user: User }>());
```

In your login page you must dispatch your actions, see the method below

```ts
  login() {

    const val = this.form.value;

    this.auth.login(val.email, val.password)
      .pipe(
        tap(user => {
          // tap deals with side effects of the subscription
          console.log(user);

          this.store.dispatch(login({user}));

          this.router.navigateByUrl('/courses');
        }),
      )
      .subscribe(
        noop,
        () => alert('login failed'),
      )

  }
```

### Grouping Actions with Action Types

In your auth module create a `actions-types.ts`with the following content

```ts
import * as AuthActions from "./auth.actions";

export { AuthActions };
```

Now you can dispatch actions in the following way

```ts
this.store.dispatch(AuthActions.login({ user }));
```

### Basic reducer configuration

In your `auth/reducer/index.ts` you need to do the following configuration

```ts
import {
  ActionReducer,
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MetaReducer,
  createReducer,
  on,
} from "@ngrx/store";
import { User } from "../model/user.model";
import { AuthActions } from "../action-types";

export const authFeatureKey = "auth";

export interface AuthState {
  user: User;
}

export const initialAuthState: AuthState = {
  user: undefined,
};

export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state, actions) => {
    return {
      user: actions.user,
    };
  })
);
```

Now in your `auth.module.ts` you need to server the new reducer

```ts
  StoreModule.forFeature(fromAuth.authFeatureKey, fromAuth.authReducer),
```

### Retrieve state with selectors

Usual selectors can not handle the state data.

Create a file `auth/auth.selectors.ts` with the following code

```ts
import { createSelector } from "@ngrx/store";

export const isLoggedIn = createSelector(
  (state) => state["auth"],
  (auth) => !!auth.user
);

export const isLoggedOut = createSelector(isLoggedIn, (loggedIn) => !loggedIn);
```

Usage

```ts
this.isLoggedIn$ = this.store.pipe(select(isLoggedIn));

this.isLoggedOut$ = this.store.pipe(select(isLoggedOut));
```

### Feature Selectors

Feature selectors can retrieve all the data from the fetured state

```ts
import { createSelector, createFeatureSelector } from "@ngrx/store";
import { AuthState } from "./reducers";

export const selectAuthState = createFeatureSelector<AuthState>("auth");

export const isLoggedIn = createSelector(
  selectAuthState,
  (auth) => !!auth.user
);

export const isLoggedOut = createSelector(isLoggedIn, (loggedIn) => !loggedIn);
```

### Handling side effects

- `ng add @ngrx/effects`

In your `app. module.ts` you need to serve the effects module

```ts
  EffectsModule.forRoot([]),
```

Also you need to serve the effects module in your feature module in my case `auth.module.ts`

```ts
EffectsModule.forFeature([]);
```

You need to create a `auth.effects.js`

```ts
import { Injectable } from "@angular/core";
import { Actions, ofType, createEffect } from "@ngrx/effects";
import { AuthActions } from "./action-types";
import { tap } from "rxjs/operators";

@Injectable()
export class AuthEffects {
  login$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.login),
        tap((action) => {
          localStorage.setItem("user", JSON.stringify(action.user));
        })
      ),
    { dispatch: false }
  );

  constructor(private actions$: Actions) {}
}
```

Now in your feature module you need to serve the new effect, follow the example

```ts
    EffectsModule.forFeature([AuthEffects]),
```

### NgRx Router Store and the Time-Travelling Debugger

In your `app.module.ts`you need to add the following import

```ts
StoreRouterConnectingModule.forRoot({
  stateKey: 'router',
  routerState: RouterState.Minimal,
}),
```

Now in your `reducers/index.ts`you need to add the router property to the reducer constant

```ts
export const reducers: ActionReducerMap<AppState> = {
  router: routerReducer,
};
```

To add runTimeChecks to the following config on the import in the `app.module.ts`

```ts
StoreModule.forRoot(reducers, {
      metaReducers,
      runtimeChecks: {
        strictStateImmutability: true,
        strictActionImmutability: true
      }
}),
```

### Metareducers

Metareducers are executed before the action itself

```ts
export function logger(reducer: ActionReducer<any>): ActionReducer<any> {
  return (state, action) => {
    console.log(`state before`, state);
    console.log(`action`, action);

    return reducer(state, action);
  }
}


export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [logger] : [];
```


## Entity Data

In your app.module add the following import

```ts
  EntityDataModule.forRoot({}),
```

Now in your lazy loaded module you need to add configuration 

```ts
const entityMetaData: EntityMetadataMap = {
  Course: {
    
  }
};

constructor(private entityDefinitionService: EntityDefinitionService) {
    entityDefinitionService.registerMetadataMap(entityMetaData)
  }
```

In order to access and handle the entities in the store you need to create services for that.

```ts
import { Injectable } from "@angular/core";
import { EntityCollectionServiceBase, EntityCollectionServiceElementsFactory } from "@ngrx/data";
import { Course } from "../model/course";

@Injectable()
export class CourseEntityService extends EntityCollectionServiceBase<Course> {
  constructor(
    serviceElementFactory: EntityCollectionServiceElementsFactory
  ) {
    super('Course', serviceElementFactory)
  }
}
```

you also need to provide the service in the lazy loaded module.


Create a new service for your entity ex: course-entity-service
```ts
import { Injectable } from "@angular/core";
import { EntityCollectionServiceBase, EntityCollectionServiceElementsFactory } from "@ngrx/data";
import { Course } from "../model/course";

@Injectable()
export class CourseEntityService extends EntityCollectionServiceBase<Course> {
  constructor(
    serviceElementFactory: EntityCollectionServiceElementsFactory
  ) {
    super('Course', serviceElementFactory)
  }
}
```

Create a new service to handle your entity with custom stuff ex: course-data-service
```ts
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { DefaultDataService, HttpUrlGenerator } from "@ngrx/data";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Course } from "../model/course";

@Injectable()
export class CoursesDataService extends DefaultDataService<Course> {
  constructor(http: HttpClient, httpUrlGenerator: HttpUrlGenerator) {
    super('Course', http, httpUrlGenerator);
  }

  getAll(): Observable<Course[]> {
    return this.http.get('/api/courses/')
      .pipe(map(res => res['payload']))
  }
}
```

Register your metadata and custom service in the lazyloaded module
```ts
const entityMetaData: EntityMetadataMap = {
  Course: {
    sortComparer: compareCourses
  },
};

export class CoursesModule {
  constructor(
    private entityDefinitionService: EntityDefinitionService,
    private entityDataService: EntityDataService,
    private coursesDataService: CoursesDataService
  ) {
    this.entityDefinitionService.registerMetadataMap(entityMetaData);

    this.entityDataService.registerService('Course', this.coursesDataService)
  }
}
```

Using a resolver to fetch data from server or cache 

```ts
import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable } from "rxjs";
import { filter, first, map, tap } from "rxjs/operators";
import { CourseEntityService } from "./services/course-entity.service";

@Injectable()
export class CoursesResolver implements Resolve<boolean> {
  loading = false;

  constructor(private coursesService: CourseEntityService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.coursesService.loaded$.pipe(
      tap((loaded) => {
        if (!loaded) {
          this.coursesService.getAll();
        }
      }),
      filter((loaded) => !!loaded),
      first()
    );
  }
}
```

Fetching data from your container component

```ts
constructor(
  private coursesService: CourseEntityService
) {}

ngOnInit() {
  this.beginnerCourses$ = this.coursesService.entities$.pipe(
      map((courses) =>
        courses.filter((course) => course.category === "BEGINNER")
      )
    );

    this.advancedCourses$ = this.coursesService.entities$.pipe(
      map((courses) =>
        courses.filter((course) => course.category === "ADVANCED")
      )
    );
}
```
