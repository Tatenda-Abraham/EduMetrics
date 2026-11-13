    function addStudent(name) {
      if (state.students.some((student) => student.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        showToast("A student with that name is already in the roster.", true);
        return false;
      }
      const student = { id: uid(), name };
      state.students.push(student);
      state.scores[student.id] = {};
      persist(); render();
      return true;
    }
    $("#student-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const input = $("#student-name");
      const name = input.value.trim();
      if (!name) return;
      if (addStudent(name)) input.value = "";
    });
    $("#add-student-focus").addEventListener("click", () => {
      $("#student-name").focus();
      $("#student-name").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    $("#category-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = $("#category-name").value.trim();
      const weight = Number($("#category-weight").value);
      if (!name || !Number.isFinite(weight) || weight <= 0 || weight > 100) {
        showToast("Enter a category name and a weight greater than 0 and at most 100%.", true);
        return;
      }
      if (state.categories.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        showToast("Category names must be unique.", true);
        return;
      }
      state.categories.push({ id: uid(), name, weight });
      persist(); render();
      $("#category-form").reset();
    });
    $("#assignment-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const name = $("#assignment-name").value.trim();
      const categoryId = $("#assignment-category").value;
      if (!name || !state.categories.some((item) => item.id === categoryId)) return;
      if (state.assignments.some((item) => item.categoryId === categoryId && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        showToast("Assignment names must be unique within their category.", true);
        return;
      }
      state.assignments.push({ id: uid(), name, categoryId });
      persist(); render();
      $("#assignment-name").value = "";
      $("#assignment-name").focus();
    });
    $("#demo-button").addEventListener("click", () => {
      if ((state.students.length || state.categories.length || state.assignments.length) &&
          !confirm("Load demo data and replace the current gradebook?")) return;
      const homework = { id: uid(), name: "Homework", weight: 20 };
      const exams = { id: uid(), name: "Exams", weight: 50 };
      const participation = { id: uid(), name: "Participation", weight: 30 };
      const assignments = [
        { id: uid(), name: "Problem set 1", categoryId: homework.id },
        { id: uid(), name: "Problem set 2", categoryId: homework.id },
        { id: uid(), name: "Unit exam", categoryId: exams.id },
        { id: uid(), name: "Final exam", categoryId: exams.id },
        { id: uid(), name: "Class engagement", categoryId: participation.id }
      ];
      const students = ["Ava Chen", "Noah Williams", "Mia Patel", "Ethan Brooks", "Sofia Garcia", "Liam Johnson"].map((name) => ({ id: uid(), name }));
      const samples = [[94,88,91,87,98],[82,90,84,86,92],[76,81,73,78,88],[68,74,71,66,80],[98,96,95,93,100],[87,79,89,82,94]];
      state = { version: 1, students, categories: [homework, exams, participation], assignments, scores: {} };
      students.forEach((student, studentIndex) => {
        state.scores[student.id] = {};
        assignments.forEach((assignment, assignmentIndex) => { state.scores[student.id][assignment.id] = samples[studentIndex][assignmentIndex]; });
      });
      persist(); render(); showToast("Demo class loaded. Try changing a score or category weight.");
    });
    function downloadFile(filename, contents, type) {
      const blob = new Blob([contents], { type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    function csvCell(value) {
      let text = String(value ?? "");
      if (/^[\t\r\n ]*[=+\-@]/.test(text)) text = `'${text}`;
      return `"${text.replace(/"/g, '""')}"`;
    }
    $("#csv-button").addEventListener("click", () => {
      const headers = ["Student", ...state.assignments.map((item) => {
        const category = state.categories.find((entry) => entry.id === item.categoryId);
        return `${category?.name || "Category"}: ${item.name}`;
      }), "Weighted grade (%)", "Letter grade"];
      const rows = state.students.map((student) => [
        student.name,
        ...state.assignments.map((assignment) => state.scores[student.id]?.[assignment.id] ?? ""),
        getStudentGrade(student.id) === null ? "" : getStudentGrade(student.id).toFixed(2),
        letterGrade(getStudentGrade(student.id)) === "—" ? "" : letterGrade(getStudentGrade(student.id))
      ]);
      const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
      downloadFile("edumetrics-grade-report.csv", `\uFEFF${csv}`, "text/csv;charset=utf-8");
      showToast("Your grade report CSV has been downloaded.");
    });
    $("#backup-button").addEventListener("click", () => {
      downloadFile("edumetrics-backup.json", JSON.stringify(state, null, 2), "application/json");
      showToast("Your EduMetrics backup has been downloaded.");
    });
    $("#import-button").addEventListener("click", () => $("#import-file").click());
    $("#import-file").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const imported = validateState(JSON.parse(await file.text()));
        if (!confirm("Import this backup and replace the current gradebook?")) return;
        state = imported;
        persist(); render(); showToast("Backup imported successfully.");
      } catch (error) {
        console.error("Could not import EduMetrics backup:", error);
        showToast(error instanceof SyntaxError ? "That file is not valid JSON." : error.message || "Could not import that backup.", true);
      } finally {
        event.target.value = "";
      }
    });
    render();
    if (startupError) showToast(startupError, true);
