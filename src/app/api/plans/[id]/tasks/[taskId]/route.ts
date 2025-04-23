import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import StudyPlan from '@/models/StudyPlan';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const { completed } = await req.json();
    
    await connectDB();
    
    const plan = await StudyPlan.findById(params.id);
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    const taskIndex = plan.tasks.findIndex(task => task.id === params.taskId);
    if (taskIndex === -1) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    plan.tasks[taskIndex].completed = completed;
    await plan.save();
    
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Error updating task' },
      { status: 500 }
    );
  }
} 