    "use strict";
    const STORAGE_KEY = "edumetrics-gradebook-v1";
    const LETTERS = ["A", "B", "C", "D", "F"];
    const $ = (selector) => document.querySelector(selector);
    let toastTimer;
    let startupError = "";
    let state = loadState();

    function uid() {
      return globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    }
    function emptyState() { return { version: 1, students: [], categories: [], assignments: [], scores: {} }; }
    function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
    function validateState(value) {
      if (!isRecord(value) || !Array.isArray(value.students) || !Array.isArray(value.categories) ||
          !Array.isArray(value.assignments) || !isRecord(value.scores)) throw new Error("The selected file is not a valid EduMetrics backup.");
      const ids = new Set();
      const checkItems = (items, label) => items.forEach((item) => {
        if (!isRecord(item) || typeof item.id !== "string" || !item.id || ids.has(item.id)) throw new Error(`Invalid or duplicate ${label} in backup.`);
        ids.add(item.id);
      });
      checkItems(value.students, "student");
      checkItems(value.categories, "category");
      checkItems(value.assignments, "assignment");
      if (value.students.some((x) => typeof x.name !== "string" || !x.name.trim()) ||
          value.categories.some((x) => typeof x.name !== "string" || !x.name.trim() || !Number.isFinite(x.weight) || x.weight < 0 || x.weight > 100) ||
          value.assignments.some((x) => typeof x.name !== "string" || !x.name.trim() || !value.categories.some((c) => c.id === x.categoryId))) {
        throw new Error("Backup contains invalid names, weights, or assignment categories.");
      }
      for (const [studentId, entries] of Object.entries(value.scores)) {
        if (!value.students.some((student) => student.id === studentId) || !isRecord(entries)) throw new Error("Backup contains scores for an unknown student.");
        for (const [assignmentId, score] of Object.entries(entries)) {
          if (!value.assignments.some((assignment) => assignment.id === assignmentId) ||
              (score !== null && (!Number.isFinite(score) || score < 0 || score > 100))) throw new Error("Backup contains an invalid score.");
        }
      }
      return {
        version: 1,
        students: value.students.map((x) => ({ id: x.id, name: x.name.trim() })),
        categories: value.categories.map((x) => ({ id: x.id, name: x.name.trim(), weight: x.weight })),
        assignments: value.assignments.map((x) => ({ id: x.id, name: x.name.trim(), categoryId: x.categoryId })),
        scores: value.scores
      };
    }
    function loadState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? validateState(JSON.parse(saved)) : emptyState();
      } catch (error) {
        console.error("Could not load EduMetrics data:", error);
        startupError = error instanceof Error
          ? `Could not load saved gradebook data: ${error.message}`
          : "Could not load saved gradebook data.";
        return emptyState();
      }
    }
    function persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (error) {
        console.error("Could not save EduMetrics data:", error);
        showToast("Could not save to browser storage. Check available storage space.", true);
        return false;
      }
    }
    function escapeHTML(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
    }
    function showToast(message, isError = false) {
      const toast = $("#toast");
      toast.textContent = message;
      toast.classList.toggle("error", isError);
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
    }
