import { NextResponse } from 'next/server';
import { visionClient } from '@/lib/vision';
import { genAI } from '@/lib/gemini';
import { Pool } from 'pg';
import formidable from 'formidable';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export const runtime = 'nodejs';

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '5432'),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Please log in to access this resource' }, { status: 401 });
  }

  const form = formidable({ multiples: false });
  const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
    form.parse(req as any, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

  const image = files.image?.[0];
  const platform = fields.platform?.[0];
  const length = fields.length?.[0];
  const tone = fields.tone?.[0];
  const description = fields.description?.[0];

  if (!image) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
  }

  const buffer = require('fs').readFileSync(image.filepath);

  try {
    const [visionResult] = await visionClient.labelDetection({ image: { content: buffer } });
    const labels = visionResult.labelAnnotations?.map(label => label.description).join(', ') || '';

    const captionPrompt = `Generate a ${tone} caption based on the following image description: '${labels}', for the ${platform} platform. The caption should be ${length} in length.`;
    const captionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const captionResponse = await captionModel.generateContent([captionPrompt]);
    const captionText = captionResponse.response.text();

    const hashtagPrompt = `Generate a list of relevant hashtags for the caption: '${captionText}'.`;
    const hashtagResponse = await captionModel.generateContent([hashtagPrompt]);
    const hashtagsText = hashtagResponse.response.text();

    const tipsPrompt = `Provide a list of tips to improve this caption for ${platform}: '${captionText}'.`;
    const tipsResponse = await captionModel.generateContent([tipsPrompt]);
    const tipsText = tipsResponse.response.text();

    const userId = session.user.id;
    await pool.query(
      'INSERT INTO captions (user_id, platform, caption, hashtags, tips) VALUES ($1, $2, $3, $4, $5)',
      [userId, platform, captionText, hashtagsText, tipsText]
    );

    return NextResponse.json({
      caption: captionText,
      hashtags: hashtagsText.split(' '),
      tips: tipsText.split('. '),
    });
  } catch (error: any) {
    console.error('Error generating caption:', error);
    return NextResponse.json({ error: 'Failed to generate caption' }, { status: 500 });
  }
}