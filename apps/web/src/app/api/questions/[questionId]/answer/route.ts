import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  readBoundedJson,
  requireAbuseAllowance,
  requireAuthenticatedActor,
  requiredString,
  requireSameOriginMutation,
  routeFailure,
} from "@/server/http-security";
import { getRuntime } from "@/server/runtime";

interface RouteContext {
  readonly params: Promise<{ readonly questionId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const correlationId = randomUUID();
    requireSameOriginMutation(request);
    const actor = await requireAuthenticatedActor(request);
    const params = await context.params;
    await requireAbuseAllowance(
      request,
      "discussion.answer",
      { actor, targetSubject: params.questionId },
      correlationId,
    );
    const input = await readBoundedJson(request);
    const answer = await getRuntime().answerPublicQuestion.execute(
      actor,
      {
        message: requiredString(input, "message"),
        questionId: params.questionId,
      },
      { correlationId },
    );
    return NextResponse.json({ id: answer.id }, { status: 201 });
  } catch (error) {
    return routeFailure(error);
  }
}
