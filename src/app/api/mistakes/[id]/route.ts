import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Mistake from '@/models/Mistake';
import Question from '@/models/Question';
import connectDB from '@/lib/db';
import mongoose from 'mongoose';

// 获取特定错题记录
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // 允许未登录用户查看错题详情，但不返回userId字段
    await connectDB();
    
    const mistakeId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(mistakeId)) {
      return NextResponse.json(
        { error: "Invalid mistake ID format" },
        { status: 400 }
      );
    }
    
    const mistake = await Mistake.findById(mistakeId).populate('questionId');
    
    if (!mistake) {
      return NextResponse.json(
        { error: "Mistake not found" },
        { status: 404 }
      );
    }
    
    // 如果用户已登录且是本人的错题，返回完整信息
    if (session && session.user.id === mistake.userId) {
      return NextResponse.json(mistake);
    }
    
    // 未登录用户或其他用户只返回公开信息
    const { userId, ...publicMistakeData } = mistake.toObject();
    return NextResponse.json(publicMistakeData);
    
  } catch (error) {
    console.error('Error fetching mistake:', error);
    return NextResponse.json(
      { error: "Failed to fetch mistake" },
      { status: 500 }
    );
  }
}

// 更新特定错题记录
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const mistakeId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(mistakeId)) {
      return NextResponse.json(
        { error: "Invalid mistake ID format" },
        { status: 400 }
      );
    }
    
    const mistake = await Mistake.findById(mistakeId);
    
    if (!mistake) {
      return NextResponse.json(
        { error: "Mistake not found" },
        { status: 404 }
      );
    }
    
    // 验证用户是否拥有此错题记录
    if (mistake.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only update your own mistakes" },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // 更新错题记录
    const updatedMistake = await Mistake.findByIdAndUpdate(
      mistakeId,
      { $set: body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json(updatedMistake);
    
  } catch (error) {
    console.error('Error updating mistake:', error);
    return NextResponse.json(
      { error: "Failed to update mistake" },
      { status: 500 }
    );
  }
}

// 删除特定错题记录
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      );
    }

    await connectDB();
    const mistakeId = params.id;

    // 验证错题是否属于当前用户
    const mistake = await Mistake.findOne({
      _id: mistakeId,
      userId: session.user.id
    });

    if (!mistake) {
      return NextResponse.json(
        { error: '错题不存在或无权限删除' },
        { status: 404 }
      );
    }

    // 删除错题
    await Mistake.findByIdAndDelete(mistakeId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除错题失败:', error);
    return NextResponse.json(
      { error: '删除错题失败' },
      { status: 500 }
    );
  }
} 