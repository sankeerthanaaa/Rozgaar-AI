import api from "../lib/axios";

const resumeService = {
  async uploadResume(file, jobDescription = "", keywords = []) {
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    formData.append("keywords", JSON.stringify(keywords));

    const res = await api.post("/resume/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  async analyzeResume(id, jobDescription = "", keywords = []) {
    const res = await api.post(`/resume/${id}/analyze`, {
      jobDescription,
      keywords,
    });
    return res.data;
  },

  async importLinkedIn(profileUrl, jobDescription = "", role = "") {
    const res = await api.post("/linkedin/import", {
      profileUrl,
      jobDescription,
      role,
    });
    return res.data;
  },

  async getResumes() {
    const res = await api.get("/resume");
    return res.data;
  },

  async deleteResume(id) {
    const res = await api.delete(`/resume/${id}`);
    return res.data;
  },

  async getResumeById(id) {
    const res = await api.get(`/resume/${id}`);
    return res.data;
  },

  async downloadModified(resumeId, appliedIds = [], format = "txt") {
    const config = format === "json" ? {} : { responseType: "blob" };
    const res = await api.post(
      "/resume/download-modified",
      { resumeId, appliedIds, format },
      config
    );
    return res.data;
  },
};

export default resumeService;
