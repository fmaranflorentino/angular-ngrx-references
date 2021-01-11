import { createAction, props } from "@ngrx/store";
import { Course } from "./model/course";

export const loadAllCourses = createAction("@Courses/loadAll");

export const allCoursesLoaded = createAction(
  "@Courses/allLoadedEffect",
  props<{ courses: Course[] }>()
);
