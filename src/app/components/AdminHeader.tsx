"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ConfirmToast from "./ConfirmToast";
import { getAuthUser } from "../lib/api";

export default function AdminHeader() {
  const router = useRouter();
  const [name, setName] = useState("관리자");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const user = getAuthUser();
    if (user?.role === "ADMIN") setName(user.name);
  }, []);

  const logout = () => {
    localStorage.removeItem("devclass-auth");
    setConfirming(false);
    router.replace("/ops/login");
  };

  return <>
    <header className="admin-header">
      <div className="container admin-header-inner">
        <div>
          <div className="eyebrow" style={{ color: "#ffba08" }}>DevClass Operations</div>
          <strong>관리자 운영 콘솔</strong>
        </div>
        <div className="actions">
          <span className="admin-identity">{name}</span>
          <button className="btn btn-soft btn-small" onClick={() => setConfirming(true)}>로그아웃</button>
        </div>
      </div>
    </header>
    {confirming && <ConfirmToast message="관리자 콘솔에서 로그아웃하시겠습니까?" confirmLabel="로그아웃" onCancel={() => setConfirming(false)} onConfirm={logout} />}
  </>;
}
