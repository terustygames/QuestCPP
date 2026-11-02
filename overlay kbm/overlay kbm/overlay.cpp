#define WIN32_LEAN_AND_MEAN
#define UNICODE
#define _UNICODE

#include <windows.h>
#include <dwmapi.h>
#include <d2d1.h>
#include <dwrite.h>
#include <commctrl.h>
#include <shlobj.h>
#include <mmsystem.h>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <string>
#include <vector>
#include <algorithm>

#pragma comment(lib, "dwmapi.lib")
#pragma comment(lib, "d2d1.lib")
#pragma comment(lib, "dwrite.lib")
#pragma comment(lib, "comctl32.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "winmm.lib")

struct CP
{
    const wchar_t *n;
    D2D1_COLOR_F c;
};

static CP g_kcP[] = {
    {L"White", {1, 1, 1, 1}},
    {L"Blue", {.35f, .55f, 1, 1}},
    {L"Red", {1, .3f, .3f, 1}},
    {L"Purple", {.7f, .3f, 1, 1}},
    {L"Orange", {1, .65f, .15f, 1}},
    {L"Cyan", {.15f, .9f, .9f, 1}},
    {L"Green", {.3f, .85f, .4f, 1}},
};
static CP g_mcP[] = {
    {L"White", {1, 1, 1, 1}},
    {L"Green", {.3f, .85f, .4f, 1}},
    {L"Red", {1, .3f, .3f, 1}},
    {L"Yellow", {1, .9f, .2f, 1}},
    {L"Pink", {1, .4f, .7f, 1}},
    {L"Cyan", {.15f, .9f, .9f, 1}},
    {L"Blue", {.35f, .55f, 1, 1}},
};
static CP g_bcP[] = {
    {L"Transparent", {0, 0, 0, 0}},
    {L"Dark Gray", {.22f, .22f, .28f, 1}},
    {L"Black", {.08f, .08f, .1f, 1}},
    {L"Dark Blue", {.1f, .12f, .25f, 1}},
    {L"Dark Green", {.1f, .2f, .12f, 1}},
    {L"Dark Red", {.25f, .1f, .1f, 1}},
    {L"Dark Purple", {.18f, .1f, .25f, 1}},
};
static CP g_brP[] = {
    {L"White", {1, 1, 1, 1}},
    {L"Gray", {.3f, .3f, .35f, 1}},
    {L"Blue", {.35f, .55f, 1, 1}},
    {L"Cyan", {.15f, .9f, .9f, 1}},
    {L"Red", {1, .3f, .3f, 1}},
    {L"None", {0, 0, 0, 0}},
};
static CP g_tuP[] = {
    {L"White", {1, 1, 1, 1}},
    {L"Light Gray", {.7f, .7f, .75f, 1}},
    {L"Yellow", {1, .95f, .4f, 1}},
    {L"Cyan", {.4f, .95f, .95f, 1}},
    {L"Green", {.4f, .95f, .5f, 1}},
    {L"Orange", {1, .7f, .3f, 1}},
    {L"Black", {0, 0, 0, 1}},
};
static CP g_tdP[] = {
    {L"White", {1, 1, 1, 1}},
    {L"Yellow", {1, .95f, .4f, 1}},
    {L"Black", {0, 0, 0, 1}},
    {L"Cyan", {.4f, .95f, .95f, 1}},
    {L"Green", {.4f, .95f, .5f, 1}},
    {L"Red", {1, .35f, .35f, 1}},
};

template <class T, int N>
constexpr int CN(T (&)[N]) { return N; }

namespace Cfg
{
    int corner = 3, scale = 100, margin = 40;
    bool bgOn = false;
    float bgA = 0.0f, btnA = 1, borA = 1;
    int iB = 0, iBr = 0, iK = 0, iM = 0, iTu = 0, iTd = 0;
    bool showShift = true, showCtrl = true, showAlt = true;

    D2D1_COLOR_F cBg = {.12f, .12f, .15f, 0};
    D2D1_COLOR_F cBU = {0, 0, 0, 0}, cKD = {1, 1, 1, 1}, cMD = {1, 1, 1, 1};
    D2D1_COLOR_F cBor = {1, 1, 1, 1}, cTU = {1, 1, 1, 1}, cTD = {1, 1, 1, 1};
    int ovW = 380, ovH = 200;
}

struct Btn
{
    const wchar_t *label;
    int vk;
    bool pressed;
    float x, y, w, h;
    bool mouse, modifier;
};

static HWND g_hw = 0, g_sw = 0;
static HHOOK g_kH = 0, g_mH = 0;
static HINSTANCE g_hi = 0;
static HFONT g_fn = 0, g_fb = 0;
static HBRUSH g_bb = 0;
static bool g_run = true, g_vis = true;

static ID2D1Factory *g_f = 0;
static ID2D1HwndRenderTarget *g_rt = 0;
static IDWriteFactory *g_dw = 0;
static IDWriteTextFormat *g_tf = 0, *g_ts = 0;

static std::vector<Btn> g_btns;

// ---------------- Input recording / replay (macro for tricks) ----------------
struct RecEv
{
    unsigned long long t; // ms since record start
    int vk;
    bool down;
    bool mouse;
};

static std::vector<RecEv> g_rec;
static bool g_recording = false, g_playing = false, g_loop = false;
static unsigned long long g_recT0 = 0, g_playT0 = 0, g_playDur = 0;
static HANDLE g_playThread = 0, g_playStopEv = 0;
static bool g_keyDown[512]; // [0..255] keyboard vk, [256..511] mouse vk

static void RecToggle();

static bool IsExtVk(int vk)
{
    // extended keys have a scan code prefixed with 0xE0
    return (MapVirtualKey((UINT)vk, MAPVK_VK_TO_VSC_EX) >> 8) == 0xE0;
}

static std::wstring RecPath()
{
    wchar_t p[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPath(0, CSIDL_APPDATA, 0, 0, p)))
    {
        auto d = std::wstring(p) + L"\\KBMOverlay";
        CreateDirectory(d.c_str(), 0);
        return d + L"\\last.kbmrec";
    }
    return L"last.kbmrec";
}

static void SaveRec()
{
    if (g_rec.empty())
        return;
    FILE *f = 0;
    _wfopen_s(&f, RecPath().c_str(), L"w");
    if (!f)
        return;
    fprintf(f, "KBMREC1\n%zu %llu\n", g_rec.size(), g_playDur);
    for (auto &e : g_rec)
        fprintf(f, "%llu %c %d %d\n", e.t, e.mouse ? 'M' : 'K', e.vk, e.down ? 1 : 0);
    fclose(f);
}

static bool LoadRec()
{
    FILE *f = 0;
    _wfopen_s(&f, RecPath().c_str(), L"r");
    if (!f)
        return false;
    char ln[64];
    g_rec.clear();
    g_playDur = 0;
    bool ok = false;
    if (fgets(ln, sizeof(ln), f) && !strncmp(ln, "KBMREC1", 7))
    {
        size_t cnt = 0;
        unsigned long long dur = 0;
        if (fscanf(f, "%zu %llu", &cnt, &dur) == 2)
        {
            ok = true;
            g_playDur = dur;
            for (size_t i = 0; i < cnt; i++)
            {
                unsigned long long t;
                char kind = 0;
                int vk = 0, dn = 0;
                if (fscanf(f, "%llu %c %d %d", &t, &kind, &vk, &dn) != 4)
                {
                    ok = false;
                    break;
                }
                g_rec.push_back({t, vk, dn != 0, kind == 'M'});
            }
        }
    }
    fclose(f);
    if (!ok || g_rec.empty())
        g_rec.clear();
    return ok && !g_rec.empty();
}

static void RecKb(int vk, bool down, bool injected)
{
    if (!g_recording || g_playing || injected)
        return;
    g_keyDown[vk & 0xFF] = down;
    unsigned long long t = GetTickCount64() - g_recT0;
    if (t > 300000 || g_rec.size() > 400000) // cap: 5 min / 400k events
    {
        RecToggle();
        return;
    }
    g_rec.push_back({t, vk, down, false});
}

static void RecMs(int vk, bool down, bool injected)
{
    if (!g_recording || g_playing || injected)
        return;
    g_keyDown[256 + (vk & 0xFF)] = down;
    unsigned long long t = GetTickCount64() - g_recT0;
    if (t > 300000 || g_rec.size() > 400000)
    {
        RecToggle();
        return;
    }
    g_rec.push_back({t, vk, down, true});
}

static void ApplyInjected(int vk, bool down, bool mouse)
{
    INPUT in;
    ZeroMemory(&in, sizeof(in));
    if (mouse)
    {
        DWORD fl = 0;
        switch (vk)
        {
        case VK_LBUTTON: fl = down ? MOUSEEVENTF_LEFTDOWN : MOUSEEVENTF_LEFTUP; break;
        case VK_RBUTTON: fl = down ? MOUSEEVENTF_RIGHTDOWN : MOUSEEVENTF_RIGHTUP; break;
        case VK_MBUTTON: fl = down ? MOUSEEVENTF_MIDDLEDOWN : MOUSEEVENTF_MIDDLEUP; break;
        case VK_XBUTTON1: fl = down ? MOUSEEVENTF_XDOWN : MOUSEEVENTF_XUP; in.mi.mouseData = XBUTTON1; break;
        case VK_XBUTTON2: fl = down ? MOUSEEVENTF_XDOWN : MOUSEEVENTF_XUP; in.mi.mouseData = XBUTTON2; break;
        default: return;
        }
        in.type = INPUT_MOUSE;
        in.mi.dwFlags = fl;
    }
    else
    {
        in.type = INPUT_KEYBOARD;
        in.ki.wVk = (WORD)vk;
        in.ki.dwFlags = (down ? 0 : KEYEVENTF_KEYUP) | (IsExtVk(vk) ? KEYEVENTF_EXTENDEDKEY : 0);
    }
    SendInput(1, &in, sizeof(in));
}

static DWORD WINAPI PlayThread(LPVOID)
{
    HANDLE hTimer = CreateWaitableTimer(0, TRUE, 0);
    HANDLE hs[2] = {hTimer, g_playStopEv};
    unsigned long long base = GetTickCount64();
    for (;;)
    {
        for (size_t i = 0; i < g_rec.size(); i++)
        {
            unsigned long long target = base + g_rec[i].t;
            while (GetTickCount64() < target)
            {
                long long waitMs = (long long)(target - GetTickCount64());
                LARGE_INTEGER due;
                due.QuadPart = -(waitMs * 10000LL); // relative, 100ns units
                SetWaitableTimer(hTimer, &due, 0, 0, 0, FALSE);
                if (WaitForMultipleObjects(2, hs, FALSE, INFINITE) != WAIT_OBJECT_0)
                    break; // stop event or error -> abort waiting
            }
            if (WaitForSingleObject(g_playStopEv, 0) == WAIT_OBJECT_0)
            {
                CloseHandle(hTimer);
                PostMessage(g_hw, WM_APP + 3, 0, 0);
                return 0;
            }
            auto &e = g_rec[i];
            PostMessage(g_hw, WM_APP + 2, (WPARAM)(e.vk | (e.down ? 0x100 : 0) | (e.mouse ? 0x200 : 0)), 0);
        }
        if (!g_loop)
            break;
        base = GetTickCount64(); // restart timing for the next loop
    }
    CloseHandle(hTimer);
    PostMessage(g_hw, WM_APP + 3, 0, 0);
    return 0;
}

static void PlayToggle()
{
    if (g_playing)
    {
        SetEvent(g_playStopEv);
        if (g_playThread)
        {
            WaitForSingleObject(g_playThread, 3000);
            CloseHandle(g_playThread);
            g_playThread = 0;
        }
        ResetEvent(g_playStopEv);
        g_playing = false;
        InvalidateRect(g_hw, 0, FALSE);
        return;
    }
    if (g_rec.empty())
        LoadRec(); // fall back to the last saved recording
    if (g_rec.empty())
        return;
    if (g_playDur == 0)
        g_playDur = g_rec.back().t;
    g_playT0 = GetTickCount64();
    ResetEvent(g_playStopEv);
    g_playing = true;
    g_playThread = CreateThread(0, 0, PlayThread, 0, 0, 0);
    InvalidateRect(g_hw, 0, FALSE);
}

static void RecToggle()
{
    if (g_playing)
        PlayToggle();
    if (g_recording)
    {
        g_recording = false;
        unsigned long long now = GetTickCount64() - g_recT0;
        // drop trailing hotkey-chord noise (Ctrl + R of the stop key) from the tail
        while (!g_rec.empty())
        {
            auto &e = g_rec.back();
            if (e.t + 600 >= now && (e.vk == VK_LCONTROL || e.vk == VK_RCONTROL || e.vk == VK_CONTROL || e.vk == 'R'))
            {
                g_keyDown[e.mouse ? 256 + (e.vk & 0xFF) : (e.vk & 0xFF)] = false;
                g_rec.pop_back();
            }
            else
                break;
        }
        // release everything still held, so a replay never leaves a key stuck in the game
        for (int i = 0; i < 512; i++)
            if (g_keyDown[i])
            {
                g_rec.push_back({now, i < 256 ? i : i - 256, false, i >= 256});
                g_keyDown[i] = false;
            }
        g_playDur = g_rec.empty() ? 0 : g_rec.back().t;
        SaveRec();
        InvalidateRect(g_hw, 0, FALSE);
    }
    else
    {
        g_rec.clear();
        g_playDur = 0;
        memset(g_keyDown, 0, sizeof(g_keyDown));
        g_recT0 = GetTickCount64();
        g_recording = true;
        InvalidateRect(g_hw, 0, FALSE);
    }
}
// ---------------- end recording / replay ----------------

static D2D1_COLOR_F ACol(D2D1_COLOR_F c, float a)
{
    c.a *= a;
    return c;
}
#define REL(x)          \
    if (x)              \
    {                   \
        (x)->Release(); \
        (x) = 0;        \
    }

static std::wstring CfgP()
{
    wchar_t p[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPath(0, CSIDL_APPDATA, 0, 0, p)))
    {
        auto d = std::wstring(p) + L"\\KBMOverlay";
        CreateDirectory(d.c_str(), 0);
        return d + L"\\settings.cfg";
    }
    return L"kbm_settings.cfg";
}

static void ApplyIdx()
{
    if (Cfg::iB >= 0 && Cfg::iB < CN(g_bcP))
        Cfg::cBU = g_bcP[Cfg::iB].c;
    if (Cfg::iBr >= 0 && Cfg::iBr < CN(g_brP))
        Cfg::cBor = g_brP[Cfg::iBr].c;
    if (Cfg::iK >= 0 && Cfg::iK < CN(g_kcP))
        Cfg::cKD = g_kcP[Cfg::iK].c;
    if (Cfg::iM >= 0 && Cfg::iM < CN(g_mcP))
        Cfg::cMD = g_mcP[Cfg::iM].c;
    if (Cfg::iTu >= 0 && Cfg::iTu < CN(g_tuP))
        Cfg::cTU = g_tuP[Cfg::iTu].c;
    if (Cfg::iTd >= 0 && Cfg::iTd < CN(g_tdP))
        Cfg::cTD = g_tdP[Cfg::iTd].c;
    Cfg::cBg.a = Cfg::bgA;
}

static void SaveCfg()
{
    FILE *f = 0;
    _wfopen_s(&f, CfgP().c_str(), L"w");
    if (!f)
        return;
    fprintf(f, "corner=%d\nscale=%d\nmargin=%d\nbgOn=%d\nbgA=%d\n"
               "btnA=%d\nborA=%d\niB=%d\niBr=%d\niK=%d\niM=%d\niTu=%d\niTd=%d\n"
               "vis=%d\nshowShift=%d\nshowCtrl=%d\nshowAlt=%d\n",
            Cfg::corner, Cfg::scale, Cfg::margin, Cfg::bgOn ? 1 : 0,
            (int)(Cfg::bgA * 100), (int)(Cfg::btnA * 100), (int)(Cfg::borA * 100),
            Cfg::iB, Cfg::iBr, Cfg::iK, Cfg::iM, Cfg::iTu, Cfg::iTd,
            g_vis ? 1 : 0, Cfg::showShift ? 1 : 0, Cfg::showCtrl ? 1 : 0, Cfg::showAlt ? 1 : 0);
    fclose(f);
}

static void LoadCfg()
{
    FILE *f = 0;
    _wfopen_s(&f, CfgP().c_str(), L"r");
    if (!f)
        return;
    char ln[256];
    while (fgets(ln, sizeof(ln), f))
    {
        char k[64];
        int v;
        if (sscanf_s(ln, "%63[^=]=%d", k, (unsigned)sizeof(k), &v) == 2)
        {
            if (!strcmp(k, "corner"))
                Cfg::corner = v;
            else if (!strcmp(k, "scale"))
                Cfg::scale = v;
            else if (!strcmp(k, "margin"))
                Cfg::margin = v;
            else if (!strcmp(k, "bgOn"))
                Cfg::bgOn = v != 0;
            else if (!strcmp(k, "bgA"))
                Cfg::bgA = v / 100.f;
            else if (!strcmp(k, "btnA"))
                Cfg::btnA = v / 100.f;
            else if (!strcmp(k, "borA"))
                Cfg::borA = v / 100.f;
            else if (!strcmp(k, "iB"))
                Cfg::iB = v;
            else if (!strcmp(k, "iBr"))
                Cfg::iBr = v;
            else if (!strcmp(k, "iK"))
                Cfg::iK = v;
            else if (!strcmp(k, "iM"))
                Cfg::iM = v;
            else if (!strcmp(k, "iTu"))
                Cfg::iTu = v;
            else if (!strcmp(k, "iTd"))
                Cfg::iTd = v;
            else if (!strcmp(k, "vis"))
                g_vis = v != 0;
            else if (!strcmp(k, "showShift"))
                Cfg::showShift = v != 0;
            else if (!strcmp(k, "showCtrl"))
                Cfg::showCtrl = v != 0;
            else if (!strcmp(k, "showAlt"))
                Cfg::showAlt = v != 0;
        }
    }
    fclose(f);
    ApplyIdx();
}

static void Build()
{
    g_btns.clear();
    float s = Cfg::scale / 100.f;
    float sz = 50 * s, sp = 6 * s, bx = 15 * s, by = 15 * s;
    float mw = 40 * s, mh = 50 * s, ms = 4 * s;
    float modW = 28 * s, modH = sz, modSp = 4 * s;

    // Count modifiers for offset
    int modCount = 0;
    if (Cfg::showShift)
        modCount++;
    if (Cfg::showCtrl)
        modCount++;
    if (Cfg::showAlt)
        modCount++;

    float modTotalW = modCount > 0 ? modCount * modW + (modCount - 1) * modSp + sp : 0;
    float keyX = bx + modTotalW;

    // Modifiers — left column, stacked vertically aligned with QWE/ASD rows
    float modX = bx;
    float row0Y = by;
    float row1Y = by + sz + sp;

    if (Cfg::showShift)
    {
        g_btns.push_back({L"Sh", VK_LSHIFT, false, modX, row0Y, modW, modH, false, true});
        modX += modW + modSp;
    }
    if (Cfg::showCtrl)
    {
        g_btns.push_back({L"Ct", VK_LCONTROL, false, modX, row0Y, modW, modH, false, true});
        modX += modW + modSp;
    }
    if (Cfg::showAlt)
    {
        g_btns.push_back({L"Alt", VK_LMENU, false, modX, row0Y, modW, modH, false, true});
        modX += modW + modSp;
    }

    // If multiple mods, stack them vertically instead
    // Actually let's put them in a column on the left
    // Reset: single column
    if (modCount > 0)
    {
        g_btns.clear();
        modX = bx;
        float singleModH = (sz * 2 + sp) / (float)modCount - (modCount > 1 ? modSp * (modCount - 1) / (float)modCount : 0);
        if (modCount == 1)
            singleModH = sz * 2 + sp;
        if (modCount == 2)
            singleModH = sz + sp / 2 - modSp / 2;
        if (modCount == 3)
            singleModH = (sz * 2 + sp - modSp * 2) / 3.f;

        float my = row0Y;
        if (Cfg::showShift)
        {
            g_btns.push_back({L"Shift", VK_LSHIFT, false, modX, my, modW, singleModH, false, true});
            my += singleModH + modSp;
        }
        if (Cfg::showCtrl)
        {
            g_btns.push_back({L"Ctrl", VK_LCONTROL, false, modX, my, modW, singleModH, false, true});
            my += singleModH + modSp;
        }
        if (Cfg::showAlt)
        {
            g_btns.push_back({L"Alt", VK_LMENU, false, modX, my, modW, singleModH, false, true});
        }
        keyX = bx + modW + sp;
    }

    // QWE ASD
    g_btns.push_back({L"Q", 'Q', false, keyX + 0 * (sz + sp), row0Y, sz, sz, false, false});
    g_btns.push_back({L"W", 'W', false, keyX + 1 * (sz + sp), row0Y, sz, sz, false, false});
    g_btns.push_back({L"E", 'E', false, keyX + 2 * (sz + sp), row0Y, sz, sz, false, false});
    g_btns.push_back({L"A", 'A', false, keyX + 0 * (sz + sp), row1Y, sz, sz, false, false});
    g_btns.push_back({L"S", 'S', false, keyX + 1 * (sz + sp), row1Y, sz, sz, false, false});
    g_btns.push_back({L"D", 'D', false, keyX + 2 * (sz + sp), row1Y, sz, sz, false, false});

    // Mouse
    float mox = keyX + 3 * (sz + sp) + 20 * s;
    g_btns.push_back({L"LMB", VK_LBUTTON, false, mox + 0 * (mw + ms), row0Y, mw, mh, true, false});
    g_btns.push_back({L"MMB", VK_MBUTTON, false, mox + 1 * (mw + ms), row0Y, mw, mh, true, false});
    g_btns.push_back({L"RMB", VK_RBUTTON, false, mox + 2 * (mw + ms), row0Y, mw, mh, true, false});
    g_btns.push_back({L"M4", VK_XBUTTON1, false, mox + 0 * (mw + ms), row0Y + mh + ms, mw, mh, true, false});
    g_btns.push_back({L"M5", VK_XBUTTON2, false, mox + 1 * (mw + ms), row0Y + mh + ms, mw, mh, true, false});

    float maxX = 0, maxY = 0;
    for (auto &b : g_btns)
    {
        maxX = (std::max)(maxX, b.x + b.w);
        maxY = (std::max)(maxY, b.y + b.h);
    }
    Cfg::ovW = (int)(maxX + 18 * s);
    Cfg::ovH = (int)(maxY + 18 * s);
}

static HRESULT EnsD2D()
{
    HRESULT hr = S_OK;
    if (!g_f)
    {
        hr = D2D1CreateFactory(D2D1_FACTORY_TYPE_SINGLE_THREADED, &g_f);
        if (FAILED(hr))
            return hr;
    }
    if (!g_dw)
    {
        hr = DWriteCreateFactory(DWRITE_FACTORY_TYPE_SHARED, __uuidof(IDWriteFactory), (IUnknown **)&g_dw);
        if (FAILED(hr))
            return hr;
    }
    float s = Cfg::scale / 100.f;
    if (!g_tf)
    {
        hr = g_dw->CreateTextFormat(L"Segoe UI", 0, DWRITE_FONT_WEIGHT_BOLD, DWRITE_FONT_STYLE_NORMAL, DWRITE_FONT_STRETCH_NORMAL, 16 * s, L"en-us", &g_tf);
        if (FAILED(hr))
            return hr;
        g_tf->SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
        g_tf->SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);
    }
    if (!g_ts)
    {
        hr = g_dw->CreateTextFormat(L"Segoe UI", 0, DWRITE_FONT_WEIGHT_SEMI_BOLD, DWRITE_FONT_STYLE_NORMAL, DWRITE_FONT_STRETCH_NORMAL, 9 * s, L"en-us", &g_ts);
        if (FAILED(hr))
            return hr;
        g_ts->SetTextAlignment(DWRITE_TEXT_ALIGNMENT_CENTER);
        g_ts->SetParagraphAlignment(DWRITE_PARAGRAPH_ALIGNMENT_CENTER);
    }
    if (!g_rt)
    {
        RECT rc;
        GetClientRect(g_hw, &rc);
        hr = g_f->CreateHwndRenderTarget(
            D2D1::RenderTargetProperties(D2D1_RENDER_TARGET_TYPE_DEFAULT,
                                         D2D1::PixelFormat(DXGI_FORMAT_B8G8R8A8_UNORM, D2D1_ALPHA_MODE_PREMULTIPLIED)),
            D2D1::HwndRenderTargetProperties(g_hw, D2D1::SizeU(rc.right, rc.bottom)), &g_rt);
    }
    return hr;
}
static void FRT() { REL(g_rt); }
static void FTF()
{
    REL(g_tf);
    REL(g_ts);
}

static void Render()
{
    if (FAILED(EnsD2D()))
        return;
    g_rt->BeginDraw();
    g_rt->Clear(D2D1::ColorF(0, 0, 0, 0));

    RECT rc;
    GetClientRect(g_hw, &rc);
    float w = (float)rc.right, h = (float)rc.bottom, cr = 8.f;

    if (Cfg::bgOn && Cfg::bgA > 0.01f)
    {
        ID2D1SolidColorBrush *b = 0;
        g_rt->CreateSolidColorBrush(Cfg::cBg, &b);
        if (b)
        {
            g_rt->FillRoundedRectangle(D2D1::RoundedRect(D2D1::RectF(0, 0, w, h), 12, 12), b);
            b->Release();
        }
    }

    ID2D1SolidColorBrush *br = 0;
    g_rt->CreateSolidColorBrush(D2D1::ColorF(1, 1, 1), &br);
    if (!br)
    {
        g_rt->EndDraw();
        return;
    }

    for (auto &b : g_btns)
    {
        auto rr = D2D1::RoundedRect(D2D1::RectF(b.x, b.y, b.x + b.w, b.y + b.h), cr, cr);
        D2D1_COLOR_F fc = b.pressed ? (b.mouse ? Cfg::cMD : Cfg::cKD) : Cfg::cBU;
        br->SetColor(ACol(fc, Cfg::btnA));
        g_rt->FillRoundedRectangle(rr, br);
        if (Cfg::borA > .01f)
        {
            br->SetColor(ACol(Cfg::cBor, Cfg::borA));
            g_rt->DrawRoundedRectangle(rr, br, 1.5f);
        }
        br->SetColor(b.pressed ? Cfg::cTD : Cfg::cTU);
        auto tr = D2D1::RectF(b.x, b.y, b.x + b.w, b.y + b.h);
        g_rt->DrawText(b.label, (UINT32)wcslen(b.label), (b.mouse || b.modifier) ? g_ts : g_tf, tr, br);
    }
    if (g_recording || g_playing)
    {
        float s = Cfg::scale / 100.f;
        wchar_t st[80];
        if (g_recording)
            swprintf_s(st, L"\x25CF REC %.1f s", (double)(GetTickCount64() - g_recT0) / 1000.0);
        else if (g_loop)
            swprintf_s(st, L"\x25B6 LOOP %.1f / %.1f s", (double)(GetTickCount64() - g_playT0) / 1000.0, (double)g_playDur / 1000.0);
        else
            swprintf_s(st, L"\x25B6 PLAY %.1f / %.1f s", (double)(GetTickCount64() - g_playT0) / 1000.0, (double)g_playDur / 1000.0);
        br->SetColor(g_recording ? D2D1::ColorF(1.f, .3f, .3f, 1.f) : D2D1::ColorF(.35f, .9f, .45f, 1.f));
        g_rt->DrawText(st, (UINT32)wcslen(st), g_ts, D2D1::RectF(4 * s, 0, w, 13 * s), br);
    }
    br->Release();
    if (g_rt->EndDraw() == D2DERR_RECREATE_TARGET)
        FRT();
}

static void Repos()
{
    HMONITOR hm = MonitorFromWindow(g_hw, MONITOR_DEFAULTTOPRIMARY);
    MONITORINFO mi = {sizeof(mi)};
    GetMonitorInfo(hm, &mi);
    int sw2 = mi.rcWork.right - mi.rcWork.left, sh = mi.rcWork.bottom - mi.rcWork.top;
    int x = mi.rcWork.left, y = mi.rcWork.top, m = Cfg::margin;
    switch (Cfg::corner)
    {
    case 0:
        x += m;
        y += m;
        break;
    case 1:
        x += sw2 - Cfg::ovW - m;
        y += m;
        break;
    case 2:
        x += m;
        y += sh - Cfg::ovH - m;
        break;
    default:
        x += sw2 - Cfg::ovW - m;
        y += sh - Cfg::ovH - m;
        break;
    }
    SetWindowPos(g_hw, HWND_TOPMOST, x, y, Cfg::ovW, Cfg::ovH, SWP_NOACTIVATE | SWP_SHOWWINDOW);
}
static void Apply()
{
    FRT();
    FTF();
    Build();
    Repos();
    InvalidateRect(g_hw, 0, TRUE);
    SaveCfg();
}

enum KbmCtrl
{
    KC_CORNER = 1001,
    KC_SCALE,
    KC_LSCALE,
    KC_MARGIN,
    KC_LMARGIN,
    KC_BGON,
    KC_BGA,
    KC_LBGA,
    KC_BCLR,
    KC_BA,
    KC_LBA,
    KC_BRCLR,
    KC_BRA,
    KC_LBRA,
    KC_KCLR,
    KC_MCLR,
    KC_TU,
    KC_TD,
    KC_SHOW,
    KC_APPLY,
    KC_CLOSE,
    KC_RESET,
    KC_SHIFT,
    KC_CTRL,
    KC_ALT,
    KC_REC,
    KC_PLAY,
    KC_LOOP,
};

struct SB
{
    HWND hw;
    int y, lm, cx, cw;
    std::vector<HWND> all;
    void sec(const wchar_t *t)
    {
        y += 6;
        all.push_back(CreateWindow(L"STATIC", t, WS_CHILD | WS_VISIBLE, lm, y, cw + 170, 20, hw, 0, g_hi, 0));
        y += 22;
        all.push_back(CreateWindow(L"STATIC", 0, WS_CHILD | WS_VISIBLE | SS_ETCHEDHORZ, lm, y, cw + 165, 2, hw, 0, g_hi, 0));
        y += 6;
    }
    void lbl(const wchar_t *t) { all.push_back(CreateWindow(L"STATIC", t, WS_CHILD | WS_VISIBLE, lm, y + 4, 165, 20, hw, 0, g_hi, 0)); }
    HWND cmb(int id)
    {
        HWND h = CreateWindow(L"COMBOBOX", 0, WS_CHILD | WS_VISIBLE | CBS_DROPDOWNLIST | WS_VSCROLL, cx, y, cw, 150, hw, (HMENU)(INT_PTR)id, g_hi, 0);
        all.push_back(h);
        y += 30;
        return h;
    }
    HWND sld(int id, int mn, int mx, int p, int lid)
    {
        HWND h = CreateWindow(TRACKBAR_CLASS, 0, WS_CHILD | WS_VISIBLE | TBS_HORZ | TBS_NOTICKS, cx, y + 1, cw - 50, 22, hw, (HMENU)(INT_PTR)id, g_hi, 0);
        SendMessage(h, TBM_SETRANGE, TRUE, MAKELPARAM(mn, mx));
        SendMessage(h, TBM_SETPOS, TRUE, p);
        all.push_back(h);
        wchar_t b[16];
        swprintf_s(b, L"%d", p);
        all.push_back(CreateWindow(L"STATIC", b, WS_CHILD | WS_VISIBLE | SS_CENTER, cx + cw - 45, y + 3, 45, 18, hw, (HMENU)(INT_PTR)lid, g_hi, 0));
        y += 26;
        return h;
    }
    HWND chk(const wchar_t *t, int id, bool c)
    {
        HWND h = CreateWindow(L"BUTTON", t, WS_CHILD | WS_VISIBLE | BS_AUTOCHECKBOX, lm, y, 250, 22, hw, (HMENU)(INT_PTR)id, g_hi, 0);
        SendMessage(h, BM_SETCHECK, c ? BST_CHECKED : BST_UNCHECKED, 0);
        all.push_back(h);
        y += 26;
        return h;
    }
    HWND btn(const wchar_t *t, int id, int bw = 110)
    {
        HWND h = CreateWindow(L"BUTTON", t, WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, cx, y, bw, 32, hw, (HMENU)(INT_PTR)id, g_hi, 0);
        all.push_back(h);
        return h;
    }
    template <int N>
    void fill(HWND h, CP (&a)[N], int s)
    {
        for (int i = 0; i < N; i++)
            SendMessage(h, CB_ADDSTRING, 0, (LPARAM)a[i].n);
        SendMessage(h, CB_SETCURSEL, s, 0);
    }
    void font(HFONT f)
    {
        for (auto h : all)
            SendMessage(h, WM_SETFONT, (WPARAM)f, TRUE);
    }
};

static LRESULT CALLBACK SetProc(HWND hw, UINT m, WPARAM wp, LPARAM lp)
{
    switch (m)
    {
    case WM_CREATE:
    {
        if (!g_fn)
            g_fn = CreateFont(-14, 0, 0, 0, FW_NORMAL, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
        if (!g_fb)
            g_fb = CreateFont(-15, 0, 0, 0, FW_BOLD, 0, 0, 0, DEFAULT_CHARSET, 0, 0, CLEARTYPE_QUALITY, 0, L"Segoe UI");
        if (!g_bb)
            g_bb = CreateSolidBrush(RGB(30, 30, 36));

        SB s = {hw, 8, 24, 200, 220};
        HWND tt = CreateWindow(L"STATIC", L"\x2699  KBM Overlay", WS_CHILD | WS_VISIBLE | SS_CENTER, 0, s.y, 480, 26, hw, 0, g_hi, 0);
        s.all.push_back(tt);
        s.y += 32;

        s.sec(L"\x25B6  Layout");
        s.lbl(L"Position:");
        {
            HWND h = s.cmb(KC_CORNER);
            for (auto t : {L"\x2196 Top-Left", L"\x2197 Top-Right", L"\x2199 Bottom-Left", L"\x2198 Bottom-Right"})
                SendMessage(h, CB_ADDSTRING, 0, (LPARAM)t);
            SendMessage(h, CB_SETCURSEL, Cfg::corner, 0);
        }
        s.lbl(L"Scale %:");
        s.sld(KC_SCALE, 50, 200, Cfg::scale, KC_LSCALE);
        s.lbl(L"Edge margin:");
        s.sld(KC_MARGIN, 0, 200, Cfg::margin, KC_LMARGIN);

        s.sec(L"\x25B6  Background");
        s.chk(L"Show Background", KC_BGON, Cfg::bgOn);
        s.lbl(L"BG Opacity %:");
        s.sld(KC_BGA, 0, 100, (int)(Cfg::bgA * 100), KC_LBGA);

        s.sec(L"\x25B6  Buttons");
        s.lbl(L"Button color:");
        {
            HWND h = s.cmb(KC_BCLR);
            s.fill(h, g_bcP, Cfg::iB);
        }
        s.lbl(L"Button opacity:");
        s.sld(KC_BA, 0, 100, (int)(Cfg::btnA * 100), KC_LBA);
        s.lbl(L"Border color:");
        {
            HWND h = s.cmb(KC_BRCLR);
            s.fill(h, g_brP, Cfg::iBr);
        }
        s.lbl(L"Border opacity:");
        s.sld(KC_BRA, 0, 100, (int)(Cfg::borA * 100), KC_LBRA);

        s.sec(L"\x25B6  Press Colors");
        s.lbl(L"Key press:");
        {
            HWND h = s.cmb(KC_KCLR);
            s.fill(h, g_kcP, Cfg::iK);
        }
        s.lbl(L"Mouse press:");
        {
            HWND h = s.cmb(KC_MCLR);
            s.fill(h, g_mcP, Cfg::iM);
        }

        s.sec(L"\x25B6  Text");
        s.lbl(L"Text idle:");
        {
            HWND h = s.cmb(KC_TU);
            s.fill(h, g_tuP, Cfg::iTu);
        }
        s.lbl(L"Text pressed:");
        {
            HWND h = s.cmb(KC_TD);
            s.fill(h, g_tdP, Cfg::iTd);
        }

        s.sec(L"\x25B6  Modifier Keys");
        s.chk(L"Show Shift", KC_SHIFT, Cfg::showShift);
        s.chk(L"Show Ctrl", KC_CTRL, Cfg::showCtrl);
        s.chk(L"Show Alt", KC_ALT, Cfg::showAlt);

        s.sec(L"\x25B6  Recording (macro)");
        {
            HWND h = CreateWindow(L"BUTTON", L"\x23FA Rec Start/Stop (Ctrl+Shift+R)", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, s.lm, s.y, s.cw + 170, 32, hw, (HMENU)(INT_PTR)KC_REC, g_hi, 0);
            s.all.push_back(h);
            s.y += 36;
        }
        {
            HWND h = CreateWindow(L"BUTTON", L"\x25B6 Play/Stop (Ctrl+Shift+P)", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, s.lm, s.y, s.cw + 170, 32, hw, (HMENU)(INT_PTR)KC_PLAY, g_hi, 0);
            s.all.push_back(h);
            s.y += 36;
        }
        s.chk(L"Loop playback (Ctrl+Shift+L)", KC_LOOP, g_loop);

        s.y += 4;
        s.chk(L"Show Overlay", KC_SHOW, g_vis);
        s.y += 4;
        s.btn(L"\x2714 Apply", KC_APPLY);
        auto bc = CreateWindow(L"BUTTON", L"\x2716 Close", WS_CHILD | WS_VISIBLE | BS_PUSHBUTTON, s.cx + 120, s.y, 110, 32, hw, (HMENU)KC_CLOSE, g_hi, 0);
        s.all.push_back(bc);
        s.y += 38;
        s.btn(L"\x21BA Reset", KC_RESET, 230);

        s.font(g_fn);
        SendMessage(tt, WM_SETFONT, (WPARAM)g_fb, TRUE);
        return 0;
    }
    case WM_ERASEBKGND:
    {
        RECT rc;
        GetClientRect(hw, &rc);
        FillRect((HDC)wp, &rc, g_bb);
        return 1;
    }
    case WM_CTLCOLORSTATIC:
    case WM_CTLCOLORBTN:
        SetTextColor((HDC)wp, RGB(220, 220, 230));
        SetBkColor((HDC)wp, RGB(30, 30, 36));
        return (LRESULT)g_bb;
    case WM_HSCROLL:
    {
        int id = GetDlgCtrlID((HWND)lp), p = (int)SendMessage((HWND)lp, TBM_GETPOS, 0, 0);
        wchar_t b[16];
        swprintf_s(b, L"%d", p);
        int lid = 0;
        switch (id)
        {
        case KC_SCALE:
            lid = KC_LSCALE;
            break;
        case KC_MARGIN:
            lid = KC_LMARGIN;
            break;
        case KC_BGA:
            lid = KC_LBGA;
            break;
        case KC_BA:
            lid = KC_LBA;
            break;
        case KC_BRA:
            lid = KC_LBRA;
            break;
        }
        if (lid)
            SetDlgItemText(hw, lid, b);
        return 0;
    }
    case WM_COMMAND:
    {
        int id = LOWORD(wp);
        if (id == KC_APPLY)
        {
            Cfg::corner = (int)SendDlgItemMessage(hw, KC_CORNER, CB_GETCURSEL, 0, 0);
            Cfg::scale = (int)SendDlgItemMessage(hw, KC_SCALE, TBM_GETPOS, 0, 0);
            Cfg::margin = (int)SendDlgItemMessage(hw, KC_MARGIN, TBM_GETPOS, 0, 0);
            Cfg::bgOn = SendDlgItemMessage(hw, KC_BGON, BM_GETCHECK, 0, 0) == BST_CHECKED;
            Cfg::bgA = (int)SendDlgItemMessage(hw, KC_BGA, TBM_GETPOS, 0, 0) / 100.f;
            Cfg::iB = (int)SendDlgItemMessage(hw, KC_BCLR, CB_GETCURSEL, 0, 0);
            Cfg::btnA = (int)SendDlgItemMessage(hw, KC_BA, TBM_GETPOS, 0, 0) / 100.f;
            Cfg::iBr = (int)SendDlgItemMessage(hw, KC_BRCLR, CB_GETCURSEL, 0, 0);
            Cfg::borA = (int)SendDlgItemMessage(hw, KC_BRA, TBM_GETPOS, 0, 0) / 100.f;
            Cfg::iK = (int)SendDlgItemMessage(hw, KC_KCLR, CB_GETCURSEL, 0, 0);
            Cfg::iM = (int)SendDlgItemMessage(hw, KC_MCLR, CB_GETCURSEL, 0, 0);
            Cfg::iTu = (int)SendDlgItemMessage(hw, KC_TU, CB_GETCURSEL, 0, 0);
            Cfg::iTd = (int)SendDlgItemMessage(hw, KC_TD, CB_GETCURSEL, 0, 0);
            Cfg::showShift = SendDlgItemMessage(hw, KC_SHIFT, BM_GETCHECK, 0, 0) == BST_CHECKED;
            Cfg::showCtrl = SendDlgItemMessage(hw, KC_CTRL, BM_GETCHECK, 0, 0) == BST_CHECKED;
            Cfg::showAlt = SendDlgItemMessage(hw, KC_ALT, BM_GETCHECK, 0, 0) == BST_CHECKED;
            g_vis = SendDlgItemMessage(hw, KC_SHOW, BM_GETCHECK, 0, 0) == BST_CHECKED;
            ApplyIdx();
            ShowWindow(g_hw, g_vis ? SW_SHOWNA : SW_HIDE);
            Apply();
        }
        else if (id == KC_CLOSE)
            DestroyWindow(hw);
        else if (id == KC_REC)
            RecToggle();
        else if (id == KC_PLAY)
            PlayToggle();
        else if (id == KC_LOOP)
            g_loop = SendDlgItemMessage(hw, KC_LOOP, BM_GETCHECK, 0, 0) == BST_CHECKED;
        else if (id == KC_RESET)
        {
            Cfg::corner = 3;
            Cfg::scale = 100;
            Cfg::margin = 40;
            Cfg::bgOn = false;
            Cfg::bgA = 0;
            Cfg::btnA = 1;
            Cfg::borA = 1;
            Cfg::iB = 0;
            Cfg::iBr = 0;
            Cfg::iK = 0;
            Cfg::iM = 0;
            Cfg::iTu = 0;
            Cfg::iTd = 0;
            Cfg::showShift = true;
            Cfg::showCtrl = true;
            Cfg::showAlt = true;
            g_vis = true;
            ApplyIdx();
            Apply();
            DestroyWindow(hw);
            g_sw = 0;
            PostMessage(g_hw, WM_APP + 1, 0, 0);
        }
        return 0;
    }
    case WM_DESTROY:
        g_sw = 0;
        return 0;
    case WM_KEYDOWN:
        if (wp == VK_ESCAPE)
        {
            DestroyWindow(hw);
            return 0;
        }
        break;
    }
    return DefWindowProc(hw, m, wp, lp);
}

static void OpenSet()
{
    if (g_sw)
    {
        SetForegroundWindow(g_sw);
        return;
    }
    static bool r = false;
    if (!r)
    {
        WNDCLASSEX wc = {sizeof(wc)};
        wc.style = CS_HREDRAW | CS_VREDRAW;
        wc.lpfnWndProc = SetProc;
        wc.hInstance = g_hi;
        wc.hCursor = LoadCursor(0, IDC_ARROW);
        wc.hbrBackground = CreateSolidBrush(RGB(30, 30, 36));
        wc.lpszClassName = L"KBMSet";
        RegisterClassEx(&wc);
        r = true;
    }
    int ww = 480, wh = 1040, sw2 = GetSystemMetrics(SM_CXSCREEN), sh = GetSystemMetrics(SM_CYSCREEN);
    g_sw = CreateWindowEx(0, L"KBMSet", L"KBM Overlay \x2014 Settings",
                          WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU, (sw2 - ww) / 2, (sh - wh) / 2, ww, wh, 0, 0, g_hi, 0);
    ShowWindow(g_sw, SW_SHOW);
    SetForegroundWindow(g_sw);
}

static LRESULT CALLBACK KbHk(int c, WPARAM w, LPARAM l)
{
    if (c == HC_ACTION)
    {
        auto *p = (KBDLLHOOKSTRUCT *)l;
        bool dn = (w == WM_KEYDOWN || w == WM_SYSKEYDOWN), up = (w == WM_KEYUP || w == WM_SYSKEYUP);
        if (p->vkCode == VK_F2 && dn)
            PostMessage(g_hw, WM_APP + 1, 0, 0);
        RecKb((int)p->vkCode, dn, (p->flags & LLKHF_INJECTED) != 0);
        int vk = (int)p->vkCode;
        if (vk == VK_RSHIFT)
            vk = VK_LSHIFT;
        if (vk == VK_RCONTROL)
            vk = VK_LCONTROL;
        if (vk == VK_RMENU)
            vk = VK_LMENU;
        if (vk == VK_SHIFT)
            vk = VK_LSHIFT;
        if (vk == VK_CONTROL)
            vk = VK_LCONTROL;
        if (vk == VK_MENU)
            vk = VK_LMENU;
        for (auto &b : g_btns)
            if (!b.mouse && b.vk == vk)
            {
                if (dn)
                    b.pressed = true;
                if (up)
                    b.pressed = false;
                InvalidateRect(g_hw, 0, FALSE);
                break;
            }
    }
    return CallNextHookEx(g_kH, c, w, l);
}

static LRESULT CALLBACK MsHk(int c, WPARAM w, LPARAM l)
{
    if (c == HC_ACTION)
    {
        auto *p = (MSLLHOOKSTRUCT *)l;
        bool inj = (p->flags & LLKHF_INJECTED) != 0;
        auto set = [&](int vk, bool s)
        {RecMs(vk, s, inj); for(auto&b:g_btns)if(b.mouse&&b.vk==vk){b.pressed=s;InvalidateRect(g_hw,0,FALSE);break;} };
        switch (w)
        {
        case WM_LBUTTONDOWN:
            set(VK_LBUTTON, 1);
            break;
        case WM_LBUTTONUP:
            set(VK_LBUTTON, 0);
            break;
        case WM_RBUTTONDOWN:
            set(VK_RBUTTON, 1);
            break;
        case WM_RBUTTONUP:
            set(VK_RBUTTON, 0);
            break;
        case WM_MBUTTONDOWN:
            set(VK_MBUTTON, 1);
            break;
        case WM_MBUTTONUP:
            set(VK_MBUTTON, 0);
            break;
        case WM_XBUTTONDOWN:
            if (HIWORD(p->mouseData) == XBUTTON1)
                set(VK_XBUTTON1, 1);
            if (HIWORD(p->mouseData) == XBUTTON2)
                set(VK_XBUTTON2, 1);
            break;
        case WM_XBUTTONUP:
            if (HIWORD(p->mouseData) == XBUTTON1)
                set(VK_XBUTTON1, 0);
            if (HIWORD(p->mouseData) == XBUTTON2)
                set(VK_XBUTTON2, 0);
            break;
        }
    }
    return CallNextHookEx(g_mH, c, w, l);
}

static LRESULT CALLBACK WProc(HWND hw, UINT m, WPARAM wp, LPARAM lp)
{
    switch (m)
    {
    case WM_PAINT:
    {
        PAINTSTRUCT ps;
        BeginPaint(hw, &ps);
        Render();
        EndPaint(hw, &ps);
        return 0;
    }
    case WM_SIZE:
        FRT();
        return 0;
    case WM_APP + 1:
        OpenSet();
        return 0;
    case WM_APP + 2:
    {
        int vk = (int)(wp & 0xFF);
        bool dn = (wp & 0x100) != 0, ms = (wp & 0x200) != 0;
        ApplyInjected(vk, dn, ms);
        int nvk = vk;
        if (nvk == VK_RSHIFT) nvk = VK_LSHIFT;
        if (nvk == VK_RCONTROL) nvk = VK_LCONTROL;
        if (nvk == VK_RMENU) nvk = VK_LMENU;
        if (nvk == VK_SHIFT) nvk = VK_LSHIFT;
        if (nvk == VK_CONTROL) nvk = VK_LCONTROL;
        if (nvk == VK_MENU) nvk = VK_LMENU;
        for (auto &b : g_btns)
            if (b.mouse == ms && b.vk == nvk)
            {
                b.pressed = dn;
                break;
            }
        InvalidateRect(hw, 0, FALSE);
        return 0;
    }
    case WM_APP + 3:
        g_playing = false;
        if (g_playThread)
        {
            CloseHandle(g_playThread);
            g_playThread = 0;
        }
        InvalidateRect(hw, 0, FALSE);
        return 0;
    case WM_TIMER:
        if (g_recording || g_playing)
            InvalidateRect(hw, 0, FALSE);
        return 0;
    case WM_HOTKEY:
        if (g_playing && wp != 5)
            return 0;
        if (wp == 1)
        {
            g_vis = !g_vis;
            ShowWindow(hw, g_vis ? SW_SHOWNA : SW_HIDE);
        }
        else if (wp == 2)
        {
            g_run = false;
            PostQuitMessage(0);
        }
        else if (wp == 3)
        {
            Cfg::corner = (Cfg::corner + 1) % 4;
            Repos();
            SaveCfg();
        }
        else if (wp == 4)
            RecToggle();
        else if (wp == 5)
            PlayToggle();
        else if (wp == 6)
        {
            g_loop = !g_loop;
            InvalidateRect(hw, 0, FALSE);
        }
        return 0;
    case WM_DESTROY:
        g_run = false;
        PostQuitMessage(0);
        return 0;
    case WM_MOUSEACTIVATE:
        return MA_NOACTIVATE;
    case WM_NCHITTEST:
        return HTTRANSPARENT;
    }
    return DefWindowProc(hw, m, wp, lp);
}

int WINAPI wWinMain(HINSTANCE hi, HINSTANCE, LPWSTR, int)
{
    g_hi = hi;
    INITCOMMONCONTROLSEX ic = {sizeof(ic), ICC_BAR_CLASSES};
    InitCommonControlsEx(&ic);
    LoadCfg();

    WNDCLASSEX wc = {sizeof(wc)};
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WProc;
    wc.hInstance = hi;
    wc.hCursor = LoadCursor(0, IDC_ARROW);
    wc.lpszClassName = L"KBMOv";
    RegisterClassEx(&wc);

    g_hw = CreateWindowEx(
        WS_EX_TOPMOST | WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE,
        wc.lpszClassName, L"KBM", WS_POPUP, 0, 0, Cfg::ovW, Cfg::ovH, 0, 0, hi, 0);
    if (!g_hw)
        return 1;

    SetLayeredWindowAttributes(g_hw, RGB(0, 0, 0), 0, LWA_COLORKEY);
    MARGINS mg = {-1};
    DwmExtendFrameIntoClientArea(g_hw, &mg);

    Build();
    Repos();
    RegisterHotKey(g_hw, 1, MOD_CONTROL | MOD_SHIFT, 'H');
    RegisterHotKey(g_hw, 2, MOD_CONTROL | MOD_SHIFT, 'X');
    RegisterHotKey(g_hw, 3, MOD_CONTROL | MOD_SHIFT, 'M');
    RegisterHotKey(g_hw, 4, MOD_CONTROL | MOD_SHIFT, 'R');
    RegisterHotKey(g_hw, 5, MOD_CONTROL | MOD_SHIFT, 'P');
    RegisterHotKey(g_hw, 6, MOD_CONTROL | MOD_SHIFT, 'L');

    g_playStopEv = CreateEvent(0, TRUE, FALSE, 0);
    SetTimer(g_hw, 99, 250, 0);
    timeBeginPeriod(1);

    g_kH = SetWindowsHookEx(WH_KEYBOARD_LL, KbHk, hi, 0);
    g_mH = SetWindowsHookEx(WH_MOUSE_LL, MsHk, hi, 0);

    ShowWindow(g_hw, g_vis ? SW_SHOWNA : SW_HIDE);

    MSG msg;
    while (g_run && GetMessage(&msg, 0, 0, 0))
    {
        if (g_sw && IsDialogMessage(g_sw, &msg))
            continue;
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    timeEndPeriod(1);
    KillTimer(g_hw, 99);
    if (g_playing)
    {
        SetEvent(g_playStopEv);
        if (g_playThread)
        {
            WaitForSingleObject(g_playThread, 3000);
            CloseHandle(g_playThread);
            g_playThread = 0;
        }
        g_playing = false;
    }
    if (g_recording)
    {
        g_recording = false;
        g_playDur = g_rec.empty() ? 0 : g_rec.back().t;
        SaveRec();
    }
    if (g_playStopEv)
        CloseHandle(g_playStopEv);
    if (g_kH)
        UnhookWindowsHookEx(g_kH);
    if (g_mH)
        UnhookWindowsHookEx(g_mH);
    FRT();
    FTF();
    REL(g_dw);
    REL(g_f);
    if (g_fn)
        DeleteObject(g_fn);
    if (g_fb)
        DeleteObject(g_fb);
    if (g_bb)
        DeleteObject(g_bb);
    return 0;
}