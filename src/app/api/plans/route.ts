import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StudyPlan from '@/models/StudyPlan';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    console.log('Received request to create plan');
    const { userId, subjects, startDate, endDate, dailyHours, tasks } = await req.json();
    
    console.log('Request data:', { userId, subjects, startDate, endDate, dailyHours, tasks });
    
    if (!userId || !subjects || !startDate || !endDate || !dailyHours || !tasks) {
      console.error('Missing required fields:', { userId, subjects, startDate, endDate, dailyHours, tasks });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 确保 userId 是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId);
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // 确保 tasks 是数组
    if (!Array.isArray(tasks)) {
      console.error('Tasks must be an array:', tasks);
      return NextResponse.json(
        { error: 'Tasks must be an array' },
        { status: 400 }
      );
    }

    console.log('Connecting to database...');
    await connectDB();
    
    // 检查用户是否存在
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
    }));
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Creating study plan...');
    const plan = await StudyPlan.create({
      userId: new mongoose.Types.ObjectId(userId),
      subjects,
      startDate,
      endDate,
      dailyHours,
      tasks,
    });
    
    console.log('Plan created successfully:', plan);
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error creating study plan:', error);
    return NextResponse.json(
      { error: 'Error creating study plan: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 确保 userId 是有效的 ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }
    
    console.log('Connecting to database...');
    await connectDB();
    
    // 检查用户是否存在
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
    }));
    
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('Fetching plans for user:', userId);
    const plans = await StudyPlan.find({ userId: new mongoose.Types.ObjectId(userId) });
    
    console.log('Found plans:', plans.length);
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Error fetching study plans: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
} 