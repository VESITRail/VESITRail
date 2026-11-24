BEGIN;

ALTER TABLE "AcademicSemester"
    ADD CONSTRAINT "AcademicSemester_date_order_check"
    CHECK ("endDate" >= "startDate");

ALTER TABLE "AcademicSemester"
    ADD CONSTRAINT "AcademicSemester_application_window_exclusion"
    EXCLUDE USING gist (
        daterange(GREATEST("startDate" - 7, DATE '0001-01-01'), "endDate", '[]') WITH &&
    );

COMMIT;
