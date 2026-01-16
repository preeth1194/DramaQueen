export class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.requestCounts = new Map();
  }

  getHistory(phone) {
    if (!this.sessions.has(phone)) {
      this.sessions.set(phone, []);
    }
    return this.sessions.get(phone);
  }

  appendUserMessage(phone, content) {
    const history = this.getHistory(phone);
    history.push({ role: "user", content });
  }

  appendAssistantMessage(phone, content) {
    const history = this.getHistory(phone);
    history.push({ role: "assistant", content });
  }

  countUserTurns(phone) {
    const history = this.getHistory(phone);
    return history.filter((entry) => entry.role === "user").length;
  }

  incrementRequestCount(phone) {
    const current = this.requestCounts.get(phone) || 0;
    const next = current + 1;
    this.requestCounts.set(phone, next);
    return next;
  }

  getRequestCount(phone) {
    return this.requestCounts.get(phone) || 0;
  }

  resetRequestCount(phone) {
    this.requestCounts.delete(phone);
  }

  clearHistory(phone) {
    this.sessions.delete(phone);
  }
}
