import api from "../lib/axios";

const interviewService = {
  async generateQuestions(resumeText, jobDescription = "", excludeQuestions = []) {
    const res = await api.post("/interview/generate", {
      resumeText,
      jobDescription,
      excludeQuestions,
    });
    return res.data;
  },

  async getQuestions(resumeId) {
    const res = await api.get(`/interview/${resumeId}`);
    return res.data;
  },
};

export default interviewService;
