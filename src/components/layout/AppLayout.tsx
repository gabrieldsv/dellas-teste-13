
import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNCMUI1QjkiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoLTZ2LTZoNnptLTYtMTJ2Nmg2di02aC02em0xMiA2djZoNnYtNmgtNnptLTYgMTJ2LTZoNnY2aC02em0xMiAwdi02aDZ2NmgtdnptLTYtMTh2Nmg2di02aC02em0xMiA2djZoNnYtNmgtNnptLTYtMTJ2Nmg2di02aC02em0xMiA2djZoNnYtNmgtNnptLTYgMTJ2LTZoNnY2aC02em0xMiAwdi02aDZ2NmgtdnptLTYtMTh2Nmg2di02aC02em0xMiA2djZoNnYtNmgtNnptLTYtMTJ2Nmg2di02aC02em0xMiA2djZoNnYtNmgtNnptLTYgMTJ2LTZoNnY2aC02em0xMiAwdi02aDZ2NmgtdnptLTYtMTh2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0wIDZ2Nmg2di02aC02em0wIDZ2Nmg2di02aC02eiIvPjwvZz48L2c+PC9zdmc+')]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-screen pt-16 lg:pt-0">
        <div className="lg:pl-72 w-full transition-all duration-300">
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
};

export default AppLayout;
