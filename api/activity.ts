import { request, cookieSerialize } from './_lib/request';
import { COURSELIST, ACTIVELIST, ACCOUNTMANAGE, PRESIGN, ANALYSIS, ANALYSIS2 } from './_lib/config';

function jsonResponse(res: any, data: any, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; return res.end(); }
  if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }

  try {
    const body = JSON.parse(await readBody(req));
    const { uf, _d, vc3, uid } = body;
    const cookies = { uf, _d, vc3, _uid: uid };

    // 1. Get courses
    const courseForm = 'courseType=1&courseFolderId=0&courseFolderSize=0';
    let courseResult;
    try {
      courseResult = await request(COURSELIST, {
        method: 'POST',
        headers: {
          'Accept': 'text/html, */*; q=0.01',
          'Accept-Encoding': 'gzip, deflate',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Cookie': `_uid=${uid}; _d=${_d}; vc3=${vc3}`,
        },
      }, courseForm);
    } catch {
      return jsonResponse(res, 'AuthRequired', 200);
    }

    if (courseResult.statusCode === 302) {
      return jsonResponse(res, 'AuthRequired', 200);
    }

    const data = courseResult.data;
    const courses: { courseId: string; classId: string }[] = [];
    let endOfCourseId: number;
    for (let i = 1; ; i++) {
      i = data.indexOf('course_', i);
      if (i === -1) break;
      endOfCourseId = data.indexOf('_', i + 7);
      courses.push({
        courseId: data.slice(i + 7, endOfCourseId),
        classId: data.slice(endOfCourseId + 1, data.indexOf('"', i + 1)),
      });
    }

    if (courses.length === 0) {
      return jsonResponse(res, 'NoCourse', 200);
    }

    // 2. Detect activity — iterate courses in batches of 5
    const detectOne = (course: { courseId: string; classId: string }) =>
      request(
        `${ACTIVELIST}?fid=0&courseId=${course.courseId}&classId=${course.classId}&_=${Date.now()}`,
        { headers: { Cookie: cookieSerialize(cookies) } }
      ).then(r => {
        const d = JSON.parse(r.data);
        if (d.data?.activeList?.length) {
          const a = d.data.activeList[0];
          const otherId = Number(a.otherId);
          if (otherId >= 0 && otherId <= 5 && a.status === 1) {
            if ((Date.now() - a.startTime) / 1000 < 7200) {
              return {
                activeId: a.id,
                name: a.nameOne,
                courseId: course.courseId,
                classId: course.classId,
                otherId,
              };
            }
          }
        }
        throw new Error('NotAvailable');
      }).catch(() => { throw new Error('NotAvailable'); });

    // Check courses in batches
    const tasks: Promise<any>[] = [];
    for (let i = 0; i < courses.length; i++) {
      tasks.push(detectOne(courses[i]));
      if (i % 5 === 0 || i === courses.length - 1) {
        try {
          const activity = await Promise.any(tasks);
          return jsonResponse(res, activity, 200);
        } catch { /* continue */ }
        tasks.length = 0;
      }
    }

    return jsonResponse(res, 'NoActivity', 200);
  } catch (e: any) {
    return jsonResponse(res, { error: e.message }, 500);
  }
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c: any) => { d += c; });
    req.on('end', () => { resolve(d); });
  });
}
