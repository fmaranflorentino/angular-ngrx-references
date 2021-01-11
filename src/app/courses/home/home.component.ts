import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { select } from "@ngrx/store";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { selectAdvancedCourses, selectPromoTotal } from "../courses.selectors";
import { EditCourseDialogComponent } from "../edit-course-dialog/edit-course-dialog.component";
import { Course } from "../model/course";
import { CourseEntityService } from "../services/course-entity.service";
import { defaultDialogConfig } from "../shared/default-dialog-config";

@Component({
  selector: "home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
})
export class HomeComponent implements OnInit {
  promoTotal$: Observable<any>;

  beginnerCourses$: Observable<Course[]>;

  advancedCourses$: Observable<Course[]>;

  constructor(
    private dialog: MatDialog,
    private coursesService: CourseEntityService
  ) {}

  ngOnInit() {
    this.reload();
  }

  reload() {
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

    this.promoTotal$ = this.coursesService.entities$.pipe(
      map((courses) => courses.filter((course) => course.promo).length)
    );
  }

  onAddCourse() {
    const dialogConfig = defaultDialogConfig();

    dialogConfig.data = {
      dialogTitle: "Create Course",
      mode: "create",
    };

    this.dialog.open(EditCourseDialogComponent, dialogConfig);
  }
}
