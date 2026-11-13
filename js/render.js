    function renderCategories() {
      $("#category-list").innerHTML = state.categories.length ? state.categories.map((category) => `
        <div class="category-row">
          <span class="category-name" title="${escapeHTML(category.name)}">${escapeHTML(category.name)}</span>
          <label class="weight-field"><span aria-hidden="true">%</span><input aria-label="${escapeHTML(category.name)} weight percentage" type="number" min="0" max="100" step="0.01" value="${category.weight}" data-weight-id="${escapeHTML(category.id)}"></label>
          <button class="icon-button" type="button" data-remove-category="${escapeHTML(category.id)}" aria-label="Remove ${escapeHTML(category.name)} category">×</button>
        </div>`).join("") : '<div class="empty">Add grade categories and set their weights to 100%.</div>';
      const total = getWeightTotal();
      $("#weight-total").textContent = `${Number(total.toFixed(2))}%`;
      const summary = $("#weight-summary");
      summary.classList.toggle("valid", isWeightTotalValid());
      summary.classList.toggle("invalid", state.categories.length > 0 && !isWeightTotalValid());
      $("#assignment-category").innerHTML = state.categories.length
        ? state.categories.map((category) => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`).join("")
        : '<option value="">Add a category first</option>';
      $("#add-assignment-button").disabled = state.categories.length === 0;
      $("#category-list").querySelectorAll("[data-weight-id]").forEach((input) => {
        input.addEventListener("change", () => {
          const value = Number(input.value);
          if (!Number.isFinite(value) || value < 0 || value > 100) {
            showToast("A category weight must be between 0 and 100%.", true);
            render();
            return;
          }
          const category = state.categories.find((item) => item.id === input.dataset.weightId);
          if (category) { category.weight = value; persist(); render(); }
        });
      });
      $("#category-list").querySelectorAll("[data-remove-category]").forEach((button) => {
        button.addEventListener("click", () => {
          const category = state.categories.find((item) => item.id === button.dataset.removeCategory);
          if (!category || !confirm(`Remove "${category.name}" and its assignments and scores?`)) return;
          const assignmentIds = state.assignments.filter((item) => item.categoryId === category.id).map((item) => item.id);
          state.categories = state.categories.filter((item) => item.id !== category.id);
          state.assignments = state.assignments.filter((item) => item.categoryId !== category.id);
          Object.values(state.scores).forEach((entries) => assignmentIds.forEach((id) => delete entries[id]));
          persist(); render();
        });
      });
    }
    function renderAssignments() {
      $("#assignment-count").textContent = state.assignments.length;
      $("#assignments-stat").textContent = state.assignments.length;
      $("#assignment-list").innerHTML = state.assignments.length ? state.assignments.map((assignment) => {
        const category = state.categories.find((item) => item.id === assignment.categoryId);
        return `<div class="assignment-row"><div class="assignment-main"><div class="assignment-name" title="${escapeHTML(assignment.name)}">${escapeHTML(assignment.name)}</div><div class="assignment-meta">${escapeHTML(category?.name || "Uncategorized")}</div></div><button class="icon-button" type="button" data-remove-assignment="${escapeHTML(assignment.id)}" aria-label="Remove ${escapeHTML(assignment.name)} assignment">×</button></div>`;
      }).join("") : '<div class="empty">No assignments yet.</div>';
      $("#assignment-list").querySelectorAll("[data-remove-assignment]").forEach((button) => {
        button.addEventListener("click", () => {
          const assignment = state.assignments.find((item) => item.id === button.dataset.removeAssignment);
          if (!assignment || !confirm(`Remove "${assignment.name}" and all its scores?`)) return;
          state.assignments = state.assignments.filter((item) => item.id !== assignment.id);
          Object.values(state.scores).forEach((entries) => delete entries[assignment.id]);
          persist(); render();
        });
      });
    }
    function renderStudents() {
      $("#students-stat").textContent = state.students.length;
      $("#roster-count").textContent = `${state.students.length} ${state.students.length === 1 ? "student" : "students"}`;
      $("#student-list").innerHTML = state.students.length ? state.students.map((student) => `
        <div class="student-item"><div class="student-info"><span class="avatar" aria-hidden="true">${escapeHTML(initials(student.name))}</span><span class="student-name">${escapeHTML(student.name)}</span></div><button class="icon-button" type="button" data-remove-student="${escapeHTML(student.id)}" aria-label="Remove ${escapeHTML(student.name)}">×</button></div>`).join("") : '<div class="empty">Your student roster will appear here.</div>';
      $("#student-list").querySelectorAll("[data-remove-student]").forEach((button) => {
        button.addEventListener("click", () => {
          const student = state.students.find((item) => item.id === button.dataset.removeStudent);
          if (!student || !confirm(`Remove ${student.name} and all of their scores?`)) return;
          state.students = state.students.filter((item) => item.id !== student.id);
          delete state.scores[student.id];
          persist(); render();
        });
      });
    }
    function renderMatrix() {
      const categories = state.categories;
      let header = '<tr><th class="student-cell">Student</th>';
      for (const category of categories) {
        const assignments = state.assignments.filter((item) => item.categoryId === category.id);
        if (!assignments.length) header += `<th title="${escapeHTML(category.name)}">${escapeHTML(category.name)} · ${category.weight}%</th>`;
        for (const assignment of assignments) header += `<th title="${escapeHTML(category.name)} — ${escapeHTML(assignment.name)}">${escapeHTML(assignment.name)}<br><span style="font-weight:500;letter-spacing:0;text-transform:none">${escapeHTML(category.name)} · ${category.weight}%</span></th>`;
      }
      header += '<th>Final</th><th>Letter</th><th aria-label="Remove student"></th></tr>';
      $("#matrix-head").innerHTML = header;
      $("#matrix-body").innerHTML = state.students.length ? state.students.map((student) => {
        let cells = `<td class="student-cell"><div class="student-info"><span class="avatar" aria-hidden="true">${escapeHTML(initials(student.name))}</span><span class="student-name" title="${escapeHTML(student.name)}">${escapeHTML(student.name)}</span></div></td>`;
        for (const category of categories) {
          const assignments = state.assignments.filter((item) => item.categoryId === category.id);
          if (!assignments.length) cells += '<td><span class="grade-na">No assignments</span></td>';
          for (const assignment of assignments) {
            const score = state.scores[student.id]?.[assignment.id];
            cells += `<td><label class="sr-only" for="score-${escapeHTML(student.id)}-${escapeHTML(assignment.id)}">${escapeHTML(student.name)}, ${escapeHTML(assignment.name)} score</label><input class="score-input" id="score-${escapeHTML(student.id)}-${escapeHTML(assignment.id)}" type="number" min="0" max="100" step="0.01" placeholder="—" value="${Number.isFinite(score) ? score : ""}" data-student-id="${escapeHTML(student.id)}" data-assignment-id="${escapeHTML(assignment.id)}"></td>`;
          }
        }
        const grade = getStudentGrade(student.id);
        const letter = letterGrade(grade);
        cells += `<td><strong>${grade === null ? "—" : `${grade.toFixed(1)}%`}</strong></td><td><span class="grade-pill ${gradeClass(letter)}">${letter}</span></td><td><button class="icon-button" type="button" data-remove-student="${escapeHTML(student.id)}" aria-label="Remove ${escapeHTML(student.name)}">×</button></td>`;
        return `<tr>${cells}</tr>`;
      }).join("") : `<tr><td class="empty" colspan="${Math.max(4, 4 + categories.reduce((sum, category) => sum + Math.max(1, state.assignments.filter((item) => item.categoryId === category.id).length), 0))}">Add a student to begin entering grades.</td></tr>`;
      $("#weight-notice").hidden = isWeightTotalValid();
      $("#weight-notice").textContent = categories.length
        ? `Category weights currently total ${Number(getWeightTotal().toFixed(2))}%. Set the total to exactly 100% to calculate weighted grades.`
        : "Add grade categories and set their weights to exactly 100% to calculate grades.";
      $("#matrix-body").querySelectorAll(".score-input").forEach((input) => {
        input.addEventListener("change", () => {
          const raw = input.value.trim();
          if (raw === "") {
            if (state.scores[input.dataset.studentId]) delete state.scores[input.dataset.studentId][input.dataset.assignmentId];
          } else {
            const score = Number(raw);
            if (!Number.isFinite(score) || score < 0 || score > 100) {
              showToast("Scores must be between 0 and 100.", true);
              input.value = state.scores[input.dataset.studentId]?.[input.dataset.assignmentId] ?? "";
              return;
            }
            state.scores[input.dataset.studentId] ||= {};
            state.scores[input.dataset.studentId][input.dataset.assignmentId] = score;
          }
          persist(); render();
        });
      });
      $("#matrix-body").querySelectorAll("[data-remove-student]").forEach((button) => {
        button.addEventListener("click", () => {
          const student = state.students.find((item) => item.id === button.dataset.removeStudent);
          if (!student || !confirm(`Remove ${student.name} and all of their scores?`)) return;
          state.students = state.students.filter((item) => item.id !== student.id);
          delete state.scores[student.id];
          persist(); render();
        });
      });
    }
    function renderAnalytics() {
      const grades = state.students.map((student) => getStudentGrade(student.id)).filter((score) => score !== null);
      const sorted = [...grades].sort((a, b) => a - b);
      const average = grades.length ? grades.reduce((sum, score) => sum + score, 0) / grades.length : null;
      const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
      const deviation = average === null ? null : Math.sqrt(grades.reduce((sum, score) => sum + (score - average) ** 2, 0) / grades.length);
      $("#average-stat").textContent = average === null ? "—" : `${average.toFixed(1)}%`;
      $("#average-foot").textContent = `${grades.length} of ${state.students.length} students graded`;
      $("#highest-stat").textContent = grades.length ? `${Math.max(...grades).toFixed(1)}%` : "—";
      $("#lowest-stat").textContent = grades.length ? `${Math.min(...grades).toFixed(1)}%` : "—";
      $("#median-stat").textContent = median === null ? "—" : `${median.toFixed(1)}%`;
      $("#deviation-stat").textContent = deviation === null ? "—" : `${deviation.toFixed(1)}%`;
      $("#graded-stat").textContent = `${grades.length}/${state.students.length}`;
      const counts = Object.fromEntries(LETTERS.map((letter) => [letter, 0]));
      grades.forEach((score) => { counts[letterGrade(score)] += 1; });
      $("#distribution-chart").innerHTML = LETTERS.map((letter) => {
        const count = counts[letter];
        const percent = grades.length ? (count / grades.length) * 100 : 0;
        return `<div class="bar-row"><strong>${letter}</strong><div class="bar-track" role="img" aria-label="${letter}: ${count} students"><div class="bar-fill ${letter.toLowerCase()}" style="width:${percent}%"></div></div><span class="bar-count">${count}</span></div>`;
      }).join("") + (grades.length ? "" : '<div class="empty">Grades will appear here once scores are entered.</div>');
    }
    function render() {
      renderCategories();
      renderAssignments();
      renderStudents();
      renderMatrix();
      renderAnalytics();
    }
