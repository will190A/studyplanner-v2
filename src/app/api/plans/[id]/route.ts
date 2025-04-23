import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StudyPlan from '@/models/StudyPlan';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { subjects, startDate, endDate, dailyHours, tasks } = await req.json();
    
    await connectDB();
    
    const plan = await StudyPlan.findByIdAndUpdate(
      params.id,
      {
        subjects,
        startDate,
        endDate,
        dailyHours,
        tasks,
      },
      { new: true }
    );
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error updating study plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const plan = await StudyPlan.findByIdAndDelete(params.id);
    
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error deleting study plan' },
      { status: 500 }
    );
  }
} 