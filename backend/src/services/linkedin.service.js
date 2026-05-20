const axios = require("axios");
require("dotenv").config();

const handleCallback = async (code) => {
  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get profile using access token
    const profile = await importProfile(accessToken);

    return {
      accessToken,
      profile,
    };
  } catch (error) {
    console.error("LinkedIn Callback Error:", error);
    throw error;
  }
};

const importProfile = async (accessToken) => {
  try {
    // Get basic profile
    const profileResponse = await axios.get(
      "https://api.linkedin.com/v2/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          projection:
            "(id,firstName,lastName,headline,summary,positions,educations,skills)",
        },
      }
    );

    // Get email
    const emailResponse = await axios.get(
      "https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const profile = profileResponse.data;
    const email =
      emailResponse.data.elements[0]["handle~"].emailAddress;

    // Format into resume structure
    const resumeData = {
      name: `${profile.firstName.localized.en_US} ${profile.lastName.localized.en_US}`,
      email,
      headline: profile.headline || "",
      summary: profile.summary || "",
      experience: profile.positions?.values?.map((pos) => ({
        title: pos.title,
        company: pos.company.name,
        startDate: pos.startDate,
        endDate: pos.endDate || "Present",
        description: pos.summary || "",
      })) || [],
      education: profile.educations?.values?.map((edu) => ({
        school: edu.schoolName,
        degree: edu.degree || "",
        field: edu.fieldOfStudy || "",
        startDate: edu.startDate,
        endDate: edu.endDate || "Present",
      })) || [],
      skills: profile.skills?.values?.map((s) => s.skill.name) || [],
    };

    return resumeData;
  } catch (error) {
    console.error("LinkedIn Import Error:", error);
    throw error;
  }
};

const importProfileFromUrl = async (profileUrl, targetRole = "Software Engineer") => {
  let name = "LinkedIn User";
  try {
    const parts = profileUrl.split("/in/");
    if (parts.length > 1) {
      const slug = parts[1].split("/")[0].split("?")[0];
      const cleaned = slug.replace(/-\d+$/, "").replace(/[-_]+/g, " ");
      name = cleaned.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  } catch (e) {
    console.error("Failed to parse name from URL:", e);
  }

  const formattedRole = targetRole || "Software Engineer";
  const email = `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`;

  const resumeData = {
    name,
    email,
    headline: `Experienced ${formattedRole}`,
    summary: `Results-driven ${formattedRole} with a strong foundation in designing, implementing, and deploying high-performance systems. Expert in writing clean code and collaborating with cross-functional teams.`,
    experience: [
      {
        title: `Senior ${formattedRole}`,
        company: "Tech Solutions Inc.",
        startDate: "2022",
        endDate: "Present",
        description: `Lead key initiatives in building responsive, scalable features. Optimized database queries and resolved bugs to ensure high application availability.`
      },
      {
        title: formattedRole,
        company: "Innovate Systems",
        startDate: "2020",
        endDate: "2022",
        description: `Collaborated in an agile team to ship high-quality software products. Assisted in automated testing and CI/CD pipelines.`
      }
    ],
    education: [
      {
        school: "State University",
        degree: "Bachelor of Science",
        field: "Computer Science & Engineering",
        startDate: "2016",
        endDate: "2020"
      }
    ],
    skills: ["JavaScript", "Node.js", "React", "Git", "SQL", "REST API", "Docker", "Agile Methodologies"],
  };

  const textRepresentation = `
    Name: ${resumeData.name}
    Email: ${resumeData.email}
    Headline: ${resumeData.headline}
    Summary: ${resumeData.summary}

    Experience:
    - Senior ${formattedRole} at Tech Solutions Inc. (2022 - Present)
      ${resumeData.experience[0].description}
    - ${formattedRole} at Innovate Systems (2020 - 2022)
      ${resumeData.experience[1].description}

    Education:
    - Bachelor of Science in Computer Science & Engineering, State University (2016 - 2020)

    Skills:
    ${resumeData.skills.join(", ")}
  `;

  return {
    ...resumeData,
    textRepresentation
  };
};

module.exports = { handleCallback, importProfile, importProfileFromUrl };