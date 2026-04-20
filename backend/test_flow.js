const axios = require('axios');

async function testFlow() {
  try {
    console.log("== 1. Creating Job ==");
    const jobRes = await axios.post('http://localhost:5000/api/jobs', {
      title: 'Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      description: 'Test Description',
      requirements: ['Req 1', 'Req 2'],
      skills: 'React, Node.js, AI'
    });
    console.log("Job Created:", jobRes.status, jobRes.data._id);
    const jobId = jobRes.data._id;

    console.log("\n== 2. Uploading Applicant ==");
    const applicantRes = await axios.post(`http://localhost:5000/api/applicants/${jobId}`, {
      profile: '{"name": "Alex Smith", "email": "alex@test.com", "skills": "JavaScript, React, Node.js"}'
    });
    console.log("Applicant Uploaded:", applicantRes.status, applicantRes.data._id);

    console.log("\n== 3. Triggering AI Screening ==");
    const aiRes = await axios.post(`http://localhost:5000/api/ai/${jobId}/screen`);
    console.log("AI Screening Finished:", aiRes.status, aiRes.data);

  } catch (error) {
    console.error("FLOW FAILED:", error.response ? error.response.status : error.message);
    if (error.response) console.error("Response data:", error.response.data);
  }
}
testFlow();
