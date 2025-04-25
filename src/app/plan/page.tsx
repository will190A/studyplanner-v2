'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePlanStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import PlanForm from '@/components/PlanForm'

export default function PlanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlanForm />
    </Suspense>
  )
} 