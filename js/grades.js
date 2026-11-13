    function isWeightTotalValid() {
      const total = state.categories.reduce((sum, category) => sum + category.weight, 0);
      return state.categories.length > 0 && Math.abs(total - 100) < 0.005;
    }
    function getWeightTotal() { return state.categories.reduce((sum, category) => sum + category.weight, 0); }
    function getStudentGrade(studentId) {
      if (!isWeightTotalValid()) return null;
      let weightedPoints = 0;
      let activeWeight = 0;
      for (const category of state.categories) {
        const assignments = state.assignments.filter((item) => item.categoryId === category.id);
        const earned = assignments.map((item) => state.scores[studentId]?.[item.id]).filter((score) => Number.isFinite(score));
        if (earned.length) {
          weightedPoints += (earned.reduce((sum, score) => sum + score, 0) / earned.length) * category.weight;
          activeWeight += category.weight;
        }
      }
      return activeWeight > 0 ? weightedPoints / activeWeight : null;
    }
    function letterGrade(score) {
      if (score === null) return "—";
      if (score >= 90) return "A";
      if (score >= 80) return "B";
      if (score >= 70) return "C";
      if (score >= 60) return "D";
      return "F";
    }
    function gradeClass(grade) { return grade === "—" ? "grade-na" : `grade-${grade.toLowerCase()}`; }
    function initials(name) {
      return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
    }
