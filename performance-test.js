/// <reference types="k6" />
import http from 'k6/http';
import { sleep, check } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

let consultationIds = [];

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration{scenario:default,method:GET}': ['p(95)<500'],
    'http_req_duration{scenario:default,method:PATCH}': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000';
const HEADERS = { 'Content-Type': 'application/json' };

export function setup() {
  console.log('Fetching consultation IDs for testing...');
  
  const response = http.get(`${BASE_URL}/consultations/search-by-keyword?keyword=gripe&limit=50`);
  
  if (response.status === 200) {
    const data = response.json();
    if (data && Array.isArray(data) && data.length > 0) {
      const ids = data.map(consultation => consultation.id).filter(id => id);
      console.log(`Found ${ids.length} consultation IDs for testing`);
      return { consultationIds: ids };
    }
  }
  
  console.warn('No consultation IDs found, PATCH tests will be skipped');
  return { consultationIds: [] };
}

export default function (data) {
  const keyword = 'gripe';
  const resGet = http.get(`${BASE_URL}/consultations/search-by-keyword?keyword=${keyword}`);
  check(resGet, {
    'GET /search-by-keyword status is 200': (r) => r.status === 200,
  });

  sleep(1);

  if (data.consultationIds && data.consultationIds.length > 0) {
    const randomId = data.consultationIds[Math.floor(Math.random() * data.consultationIds.length)];
    
    const payload = JSON.stringify({
      formData: {
        observations: `Updated by VU ${__VU} at iteration ${__ITER} - ${new Date().toISOString()}`,
      },
    });

    const resPatch = http.patch(`${BASE_URL}/consultations/${randomId}`, payload, { headers: HEADERS });
    check(resPatch, {
      'PATCH /consultations/:id status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    "performance-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}