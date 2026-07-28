import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TeacherLayout from "../../components/teacher/TeacherLayout";
import API from "../../api";
import { CommunityConfirmModal, CommunityFeedbackStyles, CommunityToast } from "../../components/teacher/CommunityFeedback";

const pageUser = {
  firstName: "Teacher",
  username: "teacher",
  fullName: "Your Name",
  role: "Teacher",
  avatarDisplay: "T",
  avatarUrl: null,
  posts: 0,
  followers: 0,
  following: 0,
};

const COMMUNITY_PERMS = [
  { key: "can_post",                 label: "Members Can Post",      icon: "✏️" },
  { key: "can_invite",               label: "Members Can Invite",    icon: "👥" },
  { key: "can_pin_posts",            label: "Members Can Pin Posts", icon: "📌" },
  { key: "can_create_announcements", label: "Members Can Announce",  icon: "📢" },
];

const avatarColors = [
  "#d7b25d","#c09a4a","#9ea66d","#7da27f",
  "#6ab5a0","#b5856a","#a07db5","#6a8fb5",
];

const STYLES = `
  .cam-wrap {
    max-width: 700px;
    margin: 0 auto;
    padding: 108px 18px 80px;
    position: relative;
    z-index: 10;
    min-height: 100vh;
  }
  .cam-topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
  }
  .cam-back {
    background: rgba(245,197,24,0.12);
    color: #F5C518;
    border: 1px solid rgba(245,197,24,0.28);
    border-radius: 99px;
    padding: 7px 16px;
    font-weight: 800;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    transition: background .15s;
  }
  .cam-back:hover { background: rgba(245,197,24,0.22); }
  .cam-add {
    background: #F5C518;
    color: #1a3010;
    border: none;
    border-radius: 99px;
    padding: 7px 16px;
    font-weight: 800;
    font-size: 12px;
    cursor: pointer;
    font-family: inherit;
    margin-left: auto;
    transition: opacity .15s;
  }
  .cam-add:hover { opacity: 0.88; }
  .cam-header {
    background: linear-gradient(135deg, rgba(245,197,24,0.18) 0%, rgba(10,28,16,0.95) 60%);
    border: 1px solid rgba(245,197,24,0.22);
    border-radius: 20px;
    padding: 22px 22px 18px;
    margin-bottom: 14px;
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .cam-header-av {
    width: 56px; height: 56px;
    border-radius: 16px;
    background: #F5C518;
    display: flex; align-items: center; justify-content: center;
    font-size: 26px; font-weight: 900; color: #1a3010;
    flex-shrink: 0;
  }
  .cam-header-name { font-size: 20px; font-weight: 900; color: #e8f0e2; line-height: 1.2; }
  .cam-header-desc { font-size: 13px; color: rgba(160,210,170,0.6); margin-top: 3px; }
  .cam-header-count {
    margin-left: auto;
    background: rgba(245,197,24,0.14);
    color: #F5C518;
    border: 1px solid rgba(245,197,24,0.28);
    border-radius: 99px;
    padding: 4px 14px;
    font-size: 12px; font-weight: 800;
    white-space: nowrap; flex-shrink: 0;
  }
  .cam-perms-card {
    background: rgba(10,28,16,0.92);
    border: 1px solid rgba(120,200,145,0.18);
    border-radius: 18px;
    margin-bottom: 14px;
    overflow: hidden;
    backdrop-filter: blur(10px);
  }
  .cam-perms-title {
    font-size: 10px; font-weight: 800;
    color: rgba(160,210,170,0.45);
    letter-spacing: 2px; text-transform: uppercase;
    padding: 14px 18px 10px;
    border-bottom: 1px solid rgba(120,200,145,0.12);
  }
  .cam-perm-row {
    display: flex; align-items: center; gap: 12px;
    padding: 13px 18px;
    border-bottom: 1px solid rgba(120,200,145,0.08);
    transition: background .12s;
    cursor: pointer;
  }
  .cam-perm-row:last-child { border-bottom: none; }
  .cam-perm-row:hover { background: rgba(245,197,24,0.05); }
  .cam-perm-icon { font-size: 17px; width: 28px; text-align: center; flex-shrink: 0; }
  .cam-perm-label { font-size: 13px; font-weight: 600; color: #e8f0e2; flex: 1; }
  .cam-toggle {
    width: 44px; height: 24px;
    border-radius: 99px;
    border: none;
    cursor: pointer;
    position: relative;
    transition: background .2s;
    flex-shrink: 0;
    padding: 0;
  }
  .cam-toggle-knob {
    position: absolute;
    top: 3px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: left .2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }
  .cam-members-card {
    background: rgba(10,28,16,0.92);
    border: 1px solid rgba(120,200,145,0.18);
    border-radius: 18px;
    overflow: hidden;
    backdrop-filter: blur(10px);
    margin-bottom: 14px;
  }
  .cam-members-title {
    font-size: 10px; font-weight: 800;
    color: rgba(160,210,170,0.45);
    letter-spacing: 2px; text-transform: uppercase;
    padding: 14px 18px 10px;
    border-bottom: 1px solid rgba(120,200,145,0.12);
    display: flex; align-items: center; justify-content: space-between;
  }
  .cam-member-row {
    display: flex; align-items: center; gap: 13px;
    padding: 11px 18px;
    border-bottom: 1px solid rgba(120,200,145,0.07);
    transition: background .12s;
  }
  .cam-member-row:last-child { border-bottom: none; }
  .cam-member-row:hover { background: rgba(245,197,24,0.04); }
  .cam-av {
    width: 42px; height: 42px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 15px; color: #1a3010;
    flex-shrink: 0;
  }
  .cam-member-name { font-size: 14px; font-weight: 700; color: #e8f0e2; line-height: 1.2; }
  .cam-member-sub { font-size: 11px; color: rgba(160,210,170,0.5); margin-top: 2px; }
  .cam-role-badge {
    margin-left: auto;
    font-size: 10px; font-weight: 800;
    padding: 3px 10px; border-radius: 99px;
    text-transform: uppercase; letter-spacing: 0.4px;
    flex-shrink: 0;
  }
  .cam-role-creator { background: rgba(245,197,24,0.16); color: #F5C518; border: 1px solid rgba(245,197,24,0.28); }
  .cam-role-member  { background: rgba(16,185,129,0.10);  color: #5eead4; border: 1px solid rgba(16,185,129,0.2); }
  .cam-remove-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,100,100,0.5); font-size: 16px;
    padding: 4px 6px; border-radius: 8px;
    transition: color .15s, background .15s;
    flex-shrink: 0; margin-left: 6px;
  }
  .cam-remove-btn:hover { color: #f87171; background: rgba(255,100,100,0.08); }
  .cam-search {
    display: flex; align-items: center; gap: 10px;
    background: rgba(245,197,24,0.06);
    border: 1px solid rgba(120,200,145,0.18);
    border-radius: 12px;
    padding: 9px 14px;
    margin: 10px 18px 4px;
  }
  .cam-search input {
    flex: 1; background: none; border: none; outline: none;
    font-size: 13px; color: #e8f0e2; font-family: inherit;
  }
  .cam-search input::placeholder { color: rgba(160,210,170,0.4); }
  .cam-save {
    width: 100%;
    background: #F5C518; color: #1a3010;
    border: none; border-radius: 14px;
    padding: 14px; font-weight: 900; font-size: 14px;
    cursor: pointer; font-family: inherit;
    transition: opacity .15s;
    margin-top: 4px;
  }
  .cam-save:hover { opacity: 0.88; }
  .cam-save:disabled { opacity: 0.5; cursor: not-allowed; }
  .cam-toast {
    position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
    background: rgba(16,185,129,0.95); color: #fff;
    padding: 11px 24px; border-radius: 99px;
    font-size: 13px; font-weight: 700;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    z-index: 999; pointer-events: none;
    animation: toastIn .25s ease;
  }
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
`;

function getDisplayName(m) {
  return (
    m.user?.fullName?.trim() ||
    m.user?.full_name?.trim() ||
    m.user?.name?.trim() ||
    m.user?.username?.trim() ||
    m.user?.email?.trim() ||
    (m.user?.id ? `User ${m.user.id}` : "Unknown")
  );
}

function getMembershipUserId(member) {
  const userId = member?.user?.id ?? member?.user_id ?? member?.member_id ?? member?.id;
  return userId == null ? "" : String(userId);
}

function getMembershipRole(member) {
  return String(
    member?.role ??
    member?.user_role ??
    member?.current_user_role ??
    member?.member_role ??
    member?.membership_role ??
    member?.user?.role ??
    member?.user?.user_role ??
    ""
  )
    .trim()
    .toLowerCase();
}

function isCreatorMembership(member, community) {
  const membershipRole = getMembershipRole(member);
  if (membershipRole === "creator" || membershipRole === "owner") {
    return true;
  }

  const memberUserId = getMembershipUserId(member);
  const creatorUserId = community?.created_by?.id ?? community?.created_by_id ?? community?.creator_id ?? community?.owner?.id ?? community?.owner_id;
  if (memberUserId && creatorUserId != null && memberUserId === String(creatorUserId)) {
    return true;
  }

  const creatorDisplayName = String(community?.created_by_display ?? "").trim().toLowerCase();
  return creatorDisplayName !== "" && getDisplayName(member).trim().toLowerCase() === creatorDisplayName;
}

export default function CommunityAllMembers() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [community, setCommunity]     = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [perms, setPerms]             = useState({});
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState("");
  const [toast, setToast]             = useState(null);
  const [error, setError]             = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    const styleId = "cam-styles";
    if (!document.getElementById(styleId)) {
      const el = document.createElement("style");
      el.id = styleId;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get(`communities/${id}/`),
      API.get(`communities/${id}/members/`),
    ]).then(([cRes, mRes]) => {
      setCommunity(cRes.data);
      setMemberships(mRes.data);
      const initPerms = {};
      COMMUNITY_PERMS.forEach(p => {
        initPerms[p.key] = Boolean(cRes.data[p.key] ?? false);
      });
      setPerms(initPerms);
    }).catch(() => setError("Failed to load community."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const showToast = (message, tone = "info") => {
    setToast({ message, tone });
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 2500);
  };

  const handleSavePerms = async () => {
    setSaving(true);
    try {
      await API.patch(`communities/${id}/`, perms);
      showToast("Permissions saved.", "success");
    } catch {
      showToast("Failed to save permissions.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (member) => {
    if (isCreatorMembership(member, community)) {
      showToast("The community creator cannot be removed.", "error");
      return;
    }

    setRemoveTarget(member);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;

    const memberId = removeTarget?.id;
    const memberName = getDisplayName(removeTarget);
    setRemoveBusy(true);
    try {
      await API.delete(`communities/${id}/members/${memberId}/remove/`);
      setMemberships(prev => prev.filter(m => m.id !== memberId));
      setRemoveTarget(null);
      showToast(`${memberName} removed.`, "success");
    } catch {
      setRemoveTarget(null);
      showToast("Failed to remove member.", "error");
    } finally {
      setRemoveBusy(false);
    }
  };

  const filtered = memberships.filter(m =>
    getDisplayName(m).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <TeacherLayout user={pageUser}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#b5e6b5" }}>
          Loading…
        </div>
      </TeacherLayout>
    );
  }

  if (error) {
    return (
      <TeacherLayout user={pageUser}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fca5a5" }}>
          {error}
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout user={pageUser}>
      <CommunityFeedbackStyles />
      <div className="cam-wrap">

        {/* Top nav */}
        <div className="cam-topbar">
          <button className="cam-back" onClick={() => navigate(`/teacher/community/${id}/feed`)}>
            ← Back
          </button>
          <button className="cam-add" onClick={() => navigate(`/teacher/community/${id}/add-members`)}>
            ➕ Add Members
          </button>
        </div>

        {/* Community header */}
        {community && (
          <div className="cam-header">
            <div className="cam-header-av">
              {community.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <div className="cam-header-name">{community.name}</div>
              {community.description && (
                <div className="cam-header-desc">{community.description}</div>
              )}
            </div>
            <div className="cam-header-count">
              {memberships.length} member{memberships.length !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Community-wide permissions */}
        <div className="cam-perms-card">
          <div className="cam-perms-title">Community Permissions</div>
          {COMMUNITY_PERMS.map(p => (
            <div
              key={p.key}
              className="cam-perm-row"
              onClick={() => setPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }))}
            >
              <span className="cam-perm-icon">{p.icon}</span>
              <span className="cam-perm-label">{p.label}</span>
              <button
                className="cam-toggle"
                style={{ background: perms[p.key] ? "#F5C518" : "rgba(120,200,145,0.18)" }}
                onClick={e => {
                  e.stopPropagation();
                  setPerms(prev => ({ ...prev, [p.key]: !prev[p.key] }));
                }}
              >
                <div
                  className="cam-toggle-knob"
                  style={{ left: perms[p.key] ? "23px" : "3px" }}
                />
              </button>
            </div>
          ))}
          <div style={{ padding: "12px 18px 14px" }}>
            <button className="cam-save" onClick={handleSavePerms} disabled={saving}>
              {saving ? "Saving…" : "Save Permissions"}
            </button>
          </div>
        </div>

        {/* Members list */}
        <div className="cam-members-card">
          <div className="cam-members-title">
            <span>Members</span>
            <span style={{ color: "#F5C518", fontSize: 11 }}>{memberships.length} total</span>
          </div>

          <div className="cam-search">
            <span style={{ color: "rgba(160,210,170,0.4)", fontSize: 14 }}>🔍</span>
            <input
              placeholder="Search members…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", color: "rgba(160,210,170,0.4)", cursor: "pointer", fontSize: 14, padding: 0 }}
              >
                ✕
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "28px", textAlign: "center", color: "rgba(160,210,170,0.4)", fontSize: 13 }}>
              No members found
            </div>
          ) : (
            filtered.map((m, i) => {
              const name = getDisplayName(m);
              const sub  = m.user?.email || m.user?.username || "";
              const isCreator = isCreatorMembership(m, community);
              return (
                <div key={m.id} className="cam-member-row">
                  <div className="cam-av" style={{ background: avatarColors[i % avatarColors.length] }}>
                    {name[0]?.toUpperCase() || "U"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cam-member-name">{name}</div>
                    {sub && <div className="cam-member-sub">{sub}</div>}
                  </div>
                  <span className={`cam-role-badge ${isCreator ? "cam-role-creator" : "cam-role-member"}`}>
                    {isCreator ? "👑 Admin" : "Member"}
                  </span>
                  {!isCreator && (
                    <button
                      className="cam-remove-btn"
                      title="Remove member"
                      onClick={() => handleRemove(m)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      <CommunityConfirmModal
        open={Boolean(removeTarget)}
        title="Remove Member"
        message={removeTarget ? `Remove ${getDisplayName(removeTarget)} from this community?` : ""}
        note="The member will lose access to the community once the request completes."
        confirmLabel="Remove Member"
        destructive
        busy={removeBusy}
        onCancel={() => {
          if (removeBusy) return;
          setRemoveTarget(null);
        }}
        onConfirm={confirmRemove}
      />

      <CommunityToast toast={toast} />
    </TeacherLayout>
  );
}
