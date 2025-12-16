export type CheeringStyle = "#조용히집중" | "#열정응원" | "#촬영러" | "#먹방러" | string;

export enum RoomStatus {
  OPEN = "OPEN",
  FULL = "FULL",
  CLOSED = "CLOSED",
  DELETED = "DELETED",
}

export enum UserRoomStatus {
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
  REJECTED = "REJECTED",
  JOINED = "JOINED",
  LEFT = "LEFT",
  KICKED = "KICKED",
}

export enum UserRoomRole {
  HOST = "HOST",
  GUEST = "GUEST",
}

export interface User {
  id: number;
  kakao_id: string;
  nickname: string;
  gender: "MALE" | "FEMALE";
  age_group: string;
  mbti?: string | null;
  cheering_styles: CheeringStyle[]; // JSON array
  status?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface MatchInfo {
  id: number;
  match_date: Date;
  home_team: string;
  away_team: string;
  stadium: string;
  home_score: number;
  away_score: number;
  status: "SCHEDULED" | "LIVE" | "ENDED";
  created_at: Date;
}

export interface Room {
  id: number;
  match_id: number;
  host_id: number;
  title: string;
  content: string | null;
  location: string | null;
  ticket_status: "RESERVED" | "NOT_RESERVED";
  max_count: number;
  is_approval_required: boolean; // mapped from TINYINT
  status: RoomStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface UserRoom {
  id: number;
  user_id: number;
  room_id: number;
  status: UserRoomStatus;
  role: UserRoomRole;
  message?: string | null;
  requested_at?: Date | null;
  decided_at?: Date | null;
  joined_at?: Date | null;
  left_at?: Date | null;
  updated_at: Date;
}

export interface RoomMessage {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  message_type: "TEXT" | "IMAGE" | "SYSTEM";
  created_at: Date;
}
