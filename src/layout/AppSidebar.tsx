"use client";
import React, { useEffect, useRef, useState,useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ASK_ORDELY_LABEL, ASK_ORDELY_ROUTE } from "@/constants/askOrdely";
import { useSidebar } from "../context/SidebarContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  CalenderIcon,
  ChatIcon,
  ChevronDownIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  PlugInIcon,
  TaskIcon,
  UserCircleIcon,
  UserIcon,
} from "../icons/index";
type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Inicio",
    path: "/",
  },
  {
    icon: <CalenderIcon />,
    name: "Citas",
    subItems: [
      { name: "Calendario", path: "/calendar" },
      { name: "Nueva cita", path: "/calendar/create" },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "Clientes",
    subItems: [
      { name: "Ver clientes", path: "/clientes" },
      { name: "Nuevo cliente", path: "/clientes/nuevo" },
    ],
  },
  {
    icon: <UserIcon />,
    name: "Colaboradores",
    subItems: [
      { name: "Ver colaboradores", path: "/colaboradores" },
      { name: "Nuevo colaborador", path: "/colaboradores/nuevo" },
    ],
  },
  {
    icon: <TaskIcon />,
    name: "Servicios",
    subItems: [
      { name: "Catálogo", path: "/servicios" },
      { name: "Nuevo servicio", path: "/servicios/nuevo" },
    ],
  },
  {
    icon: <ChatIcon />,
    name: ASK_ORDELY_LABEL,
    path: ASK_ORDELY_ROUTE,
  },
  {
    icon: <UserCircleIcon />,
    name: "Mi perfil",
    path: "/profile",
  },
  {
    icon: <PlugInIcon />,
    name: "Configuración",
    path: "/configuracion",
    adminOnly: true,
  },
];

const othersItems: NavItem[] = [];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const renderMenuItems = (
    navItems: NavItem[],
    menuType: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className={`menu-item-text`}>{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => {
                  const siblingPaths = nav.subItems!.map((s) => s.path);
                  const subActive = isSubItemActive(subItem.path, siblingPaths);
                  return (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        className={`menu-dropdown-item ${
                          subActive
                            ? "menu-dropdown-item-active"
                            : "menu-dropdown-item-inactive"
                        }`}
                      >
                        {subItem.name}
                        <span className="flex items-center gap-1 ml-auto">
                          {subItem.new && (
                            <span
                              className={`ml-auto ${
                                subActive
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              new
                            </span>
                          )}
                          {subItem.pro && (
                            <span
                              className={`ml-auto ${
                                subActive
                                  ? "menu-dropdown-badge-active"
                                  : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge `}
                            >
                              pro
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      if (pathname === path) return true;
      if (path.length > 1 && pathname.startsWith(`${path}/`)) return true;
      return false;
    },
    [pathname]
  );

  /** Evita que `/calendar` quede activo en `/calendar/create` u otras rutas hijas con hermano más específico. */
  const isSubItemActive = useCallback(
    (path: string, siblingPaths: string[]) => {
      if (pathname === path) return true;
      if (path.length <= 1 || !pathname.startsWith(`${path}/`)) return false;
      const moreSpecific = siblingPaths.some(
        (s) =>
          s !== path &&
          s.startsWith(`${path}/`) &&
          (pathname === s || pathname.startsWith(`${s}/`))
      );
      return !moreSpecific;
    },
    [pathname]
  );

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? visibleNavItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname,isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          {/* Ordely logomark — violet square with O */}
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white shadow-sm">
            O
          </span>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
              Ordely
            </span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Principal"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(visibleNavItems, "main")}
            </div>

            {othersItems.length > 0 && (
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Otros"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
