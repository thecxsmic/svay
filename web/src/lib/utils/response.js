/**
 * Standardized API Response Utilities
 */

import { NextResponse } from "next/server";

export function apiSuccess(data, status = 200, headers = {}) {
  return NextResponse.json({ success: true, ...data }, { status, headers });
}

export function apiError(error, status = 500, headers = {}) {
  console.error("API Error:", error);
  return NextResponse.json(
    { 
      success: false, 
      error: error.message || "Internal Server Error",
      details: error.details || null
    }, 
    { status: error.status || status, headers }
  );
}

