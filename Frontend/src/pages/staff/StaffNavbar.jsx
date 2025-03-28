"use client";

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HomeIcon from "@mui/icons-material/Home";
import PeopleIcon from "@mui/icons-material/People";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Cookies from "js-cookie";
import axios from "axios";
import logo from "../../assets/Logo.svg";
import CenteredModal from "../../components/staff/mcq/ConfirmModal";

const StaffNavbar = () => {
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(null);
  const [activeLink, setActiveLink] = useState(location.pathname);
  const [targetPath, setTargetPath] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    if (window.location.pathname.includes("mcq/combinedDashboard")) {
      setIsConfirmModalOpen(true);
      setTargetPath("/stafflogin");
      return;
    }

    try {
      // Call the backend logout endpoint with withCredentials
      await axios.post(
        `${API_BASE_URL}/api/staff/staff_logout/`,
        {},
        { withCredentials: true }
      );

      // Remove JWT token without specifying path
      Cookies.remove("jwt");
      Cookies.remove("refreshToken");

      // Try removing using different paths (optional)
      document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // Clear username cookie and localStorage
      Cookies.remove("username");
      localStorage.removeItem("staffProfilePictureBase64");
      localStorage.removeItem("staffProfilePicture");
      localStorage.clear();
      sessionStorage.clear();

      // Navigate to login page after clearing
      navigate("/stafflogin");
      handleMenuClose();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error("Error during logout:", error);
      // Handle error (e.g., show a message to the user)
    }
  };

  const handleSettings = async () => {
    if (window.location.pathname.includes("mcq/combinedDashboard")) {
      setIsConfirmModalOpen(true);
      setTargetPath("/staffprofile");
      return;
    }
    navigate("/staffprofile");
    handleMenuClose();
    setMobileMenuOpen(false);
  };

  // Load profile picture from various sources
  const loadProfilePicture = () => {
    try {
      // First priority: Check for base64 image in localStorage
      const storedBase64Image = localStorage.getItem(
        "staffProfilePictureBase64"
      );

      if (storedBase64Image && storedBase64Image.startsWith("data:image/")) {
        console.log("StaffNavbar: Using stored base64 profile picture");
        setProfilePicture(storedBase64Image);
        setImageLoading(false);
        return;
      }

      // Second priority: Check for URL-based images
      const storedProfilePicture = localStorage.getItem("staffProfilePicture");
      console.log(
        "StaffNavbar: Checking staff profile picture from storage:",
        storedProfilePicture
      );

      if (
        storedProfilePicture &&
        storedProfilePicture !== "undefined" &&
        storedProfilePicture !== "null"
      ) {
        // If from Google, enhance the resolution
        if (storedProfilePicture.includes("googleusercontent.com")) {
          // Try to get the highest quality version
          let highResUrl = storedProfilePicture;

          // Replace s96-c (default size) with s400-c (higher resolution)
          if (storedProfilePicture.includes("=s")) {
            highResUrl = storedProfilePicture.replace(/=s\d+-c/, "=s400-c");
          }

          console.log("StaffNavbar: Using enhanced Google profile picture");
          setProfilePicture(highResUrl);
        }
        // Handle relative paths from server
        else if (
          storedProfilePicture.startsWith("/") &&
          !storedProfilePicture.startsWith("http")
        ) {
          // Convert relative path to full URL using BASE_URL
          const fullImageUrl = `${API_BASE_URL}${storedProfilePicture}`;
          console.log(
            "StaffNavbar: Converting relative path to full URL:",
            fullImageUrl
          );
          setProfilePicture(fullImageUrl);
        }
        // Handle absolute URLs
        else if (storedProfilePicture.startsWith("http")) {
          setProfilePicture(storedProfilePicture);
        }
        // Handle other formats
        else {
          setProfilePicture(storedProfilePicture);
        }
      } else {
        // If no image found, try to fetch it from server
        fetchProfilePicture();
      }
    } catch (err) {
      console.error("StaffNavbar: Error loading profile picture:", err);
    } finally {
      setImageLoading(false);
    }
  };

  // Add a new function to fetch the profile picture from server if needed
  const fetchProfilePicture = async () => {
    try {
      console.log("StaffNavbar: Fetching profile picture from server");
      const response = await axios.get(`${API_BASE_URL}/api/staff/profile/`, {
        withCredentials: true,
      });

      if (response.data.profileImage) {
        // If profile has a base64 image, store it in localStorage
        if (response.data.profileImage.startsWith("data:image/")) {
          localStorage.setItem(
            "staffProfilePictureBase64",
            response.data.profileImage
          );
          setProfilePicture(response.data.profileImage);
        } else if (response.data.profileImage) {
          localStorage.setItem(
            "staffProfilePicture",
            response.data.profileImage
          );
          setProfilePicture(response.data.profileImage);
        }
      }
    } catch (err) {
      console.error("StaffNavbar: Error fetching profile from server:", err);
    }
  };

  // Handle storage events (for when profile picture is updated in another component)
  const handleStorageChange = (e) => {
    if (
      e.key === "staffProfilePictureBase64" ||
      e.key === "staffProfilePicture"
    ) {
      console.log(
        "StaffNavbar: Storage change detected for profile picture, reloading..."
      );
      loadProfilePicture();
    }
  };

  useEffect(() => {
    const storedUsername = Cookies.get("username");
    if (storedUsername) {
      setUsername(decodeURIComponent(storedUsername));
    }

    // Load profile picture
    loadProfilePicture();

    // Listen for profile picture updates from other components
    window.addEventListener("storage", handleStorageChange);

    const handleScroll = () => {
      if (window.scrollY > 60) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    // Set up an interval to check for profile picture updates
    // This helps with synchronization when localStorage doesn't trigger storage events
    const checkProfileInterval = setInterval(loadProfilePicture, 3000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("resize", handleResize);
      clearInterval(checkProfileInterval);
    };
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  const handleLinkClick = async (path) => {
    if (window.location.pathname.includes("mcq/combinedDashboard")) {
      setIsConfirmModalOpen(true);
      setTargetPath(path);
      setActiveLink(path);
      return;
    }
    setActiveLink(path);
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Get the first letter of the username (or a default if username is empty)
  const getInitial = () => {
    return username ? username.charAt(0).toUpperCase() : "U";
  };

  // Handle successful image load
  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Handle image error
  const handleImageError = (e) => {
    console.error("StaffNavbar: Failed to load profile picture:", e.target.src);

    // Try alternative URL format if it's a relative path
    if (
      e.target.src.includes(API_BASE_URL) &&
      !e.target.src.includes("/media") &&
      e.target.src.includes("/staff_profiles/")
    ) {
      // Try with /media prefix (common Django pattern)
      const mediaPrefixUrl = e.target.src.replace(
        "/staff_profiles/",
        "/media/staff_profiles/"
      );
      console.log(
        "StaffNavbar: Trying alternative URL format (media prefix):",
        mediaPrefixUrl
      );

      // Update the image source
      e.target.src = mediaPrefixUrl;

      // Add final error handler
      e.target.onerror = () => {
        console.error(
          "StaffNavbar: All profile picture attempts failed, using fallback"
        );
        setProfilePicture("");
      };
    } else {
      // Fall back to initial-based avatar
      setProfilePicture("");
    }
  };

  return (
    <>
      <div
        className={`flex fixed right-0 left-0 top-0 z-20  justify-between items-center transition-all duration-500 pb-3 ${
          isScrolled ? "bg-gray-300 bg-opacity-50" : "bg-transparent"
        }`}
      >
        {isConfirmModalOpen && (
          <CenteredModal
            isConfirmModalOpen={isConfirmModalOpen}
            setIsConfirmModalOpen={setIsConfirmModalOpen}
            targetPath={targetPath}
          />
        )}

        {/* Mobile Menu Button - only visible on small screens, now on the left */}
        {isMobile && (
          <IconButton
            onClick={toggleMobileMenu}
            className="lg:hidden ml-2"
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Logo - centered on all screen sizes */}
        <div className={`flex items-center ${isMobile ? "mx-auto" : "ml-5"}`}>
          <Tooltip title="SNS Institutions">
            <span
              className="cursor-pointer mt-1"
              onClick={() => handleLinkClick("/staffdashboard")}
            >
              <img
                src={logo || "/placeholder.svg"}
                alt="Logo"
                className="h-16 mb-1"
              />
            </span>
          </Tooltip>
        </div>

        {/* Desktop Navigation - hidden on small screens */}
        {!isMobile && (
          <div className="hidden lg:flex items-center bg-white justify-between mr-7 ml-3 border w-9/12 rounded-lg p-4 mt-3">
            <div>
              <h2 className="flex text-lg text-[#111933] font-extrabold">
                SNS ASSESSMENT PORTAL
              </h2>
            </div>
            <nav className="flex gap-14 text-black mr-20">
              <Tooltip title="Home Dashboard">
                <span
                  className={`font-bold transition-all duration-300 relative cursor-pointer
              ${
                activeLink === "/staffdashboard"
                  ? "text-[#111933] font-bold"
                  : "text-[#111933ef]"
              }`}
                  onClick={() => handleLinkClick("/staffdashboard")}
                >
                  HOME
                  {activeLink === "/staffdashboard" && (
                    <span className="blinking-dot"></span>
                  )}
                </span>
              </Tooltip>

              <Tooltip title="View and Manage Students">
                <span
                  className={`font-bold transition-all duration-300 relative cursor-pointer
              ${
                activeLink === "/staffstudentprofile"
                  ? "text-[#111933] font-semibold"
                  : "text-[#111933]"
              }`}
                  onClick={() => handleLinkClick("/staffstudentprofile")}
                >
                  STUDENT
                  {activeLink === "/staffstudentprofile" && (
                    <span className="blinking-dot"></span>
                  )}
                </span>
              </Tooltip>
              <Tooltip title="Access Library Resources">
                <span
                  className={`font-bold transition-all duration-300 relative cursor-pointer
              ${
                activeLink === "/library"
                  ? "text-[#111933] font-bold"
                  : "text-[#111933]"
              }`}
                  onClick={() => handleLinkClick("/library")}
                >
                  LIBRARY
                  {activeLink === "/library" && (
                    <span className="blinking-dot"></span>
                  )}
                </span>
              </Tooltip>
            </nav>
            <div className="mr-2">
              <button
                className="bg-gradient-to-r from-[#111933c9] to-[#111933] rounded-md text-sm text-white px-3 py-2 hover:scale-102 hover:bg-[#111933] transition-all duration-300"
                onClick={() => {
                  navigate("/mcq/details");
                }}
              >
                CREATE TEST
              </button>
            </div>
          </div>
        )}

        {/* User Profile - Desktop */}
        {!isMobile && (
          <div className="hidden lg:flex items-center gap-4 mt-4 text-[#fff]">
            <div className="flex items-center mr-2 gap-1">
              <span className="mb-2 text-xl text-[#111933]">
                {username || "User"}
              </span>
              <button onClick={handleMenuOpen} className="p-1 relative">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-full mb-2">
                    <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {profilePicture ? (
                  <img
                    src={profilePicture || "/placeholder.svg"}
                    alt="Profile"
                    className="mb-2 rounded-full h-12 w-12 object-cover border-2 border-[#111933]"
                    style={{
                      filter: "contrast(1.05) saturate(1.1)",
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    referrerPolicy="no-referrer" // Important for Google images
                  />
                ) : (
                  <div className="mb-2 rounded-full h-12 w-12 flex items-center justify-center bg-[#111933] text-white font-bold text-xl">
                    {getInitial()}
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Mobile User Profile - only visible on small screens, now on the right */}
        {isMobile && (
          <div className="flex lg:hidden items-center mr-4">
            <button
              onClick={(e) => {
                if (window.innerWidth < 768) {
                  // Navigate to staff profile page on mobile
                  navigate("/staffprofile");
                } else {
                  // Original menu opening function on desktop
                  handleMenuOpen(e);
                }
              }}
              className="p-1 relative"
            >
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-700 rounded-full">
                  <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {profilePicture ? (
                <img
                  src={profilePicture || "/placeholder.svg"}
                  alt="Profile"
                  className="rounded-full h-10 w-10 object-cover border-2 border-[#111933]"
                  style={{
                    filter: "contrast(1.05) saturate(1.1)",
                  }}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="rounded-full h-10 w-10 flex items-center justify-center bg-[#111933] text-white font-bold text-lg">
                  {getInitial()}
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        className="lg:hidden"
      >
        <div className="w-64 sm:w-80">
          <div className="flex justify-between items-center p-4 border-b">
            <div className=" items-center">
              <img
                src={logo || "/placeholder.svg"}
                alt="Logo"
                className="h-10 mr-2"
              />
              <h2 className="text-sm font-bold text-[#111933] whitespace-nowrap">
                SNS ASSESSMENT PORTAL
              </h2>
            </div>
            <IconButton onClick={toggleMobileMenu}>
              <CloseIcon className="mb-10" />
            </IconButton>
          </div>

          {/* <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              {profilePicture ? (
                <img
                  src={profilePicture || "/placeholder.svg"}
                  alt="Profile"
                  className="rounded-full h-12 w-12 object-cover border-2 border-[#111933]"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="rounded-full h-12 w-12 flex items-center justify-center bg-[#111933] text-white font-bold text-xl">
                  {getInitial()}
                </div>
              )}
              <span className="text-lg font-medium text-[#111933]">{username || "User"}</span>
            </div>
          </div> */}

          <List>
            <ListItem
              button
              onClick={() => handleLinkClick("/staffdashboard")}
              className={activeLink === "/staffdashboard" ? "bg-gray-100" : ""}
            >
              <HomeIcon className="mr-3 text-[#111933]" />
              <ListItemText
                primary="HOME"
                className={
                  activeLink === "/staffdashboard"
                    ? "font-bold text-[#111933]"
                    : "text-[#111933]"
                }
              />
            </ListItem>

            <ListItem
              button
              onClick={() => handleLinkClick("/staffstudentprofile")}
              className={
                activeLink === "/staffstudentprofile" ? "bg-gray-100" : ""
              }
            >
              <PeopleIcon className="mr-3 text-[#111933]" />
              <ListItemText
                primary="STUDENT"
                className={
                  activeLink === "/staffstudentprofile"
                    ? "font-bold text-[#111933]"
                    : "text-[#111933]"
                }
              />
            </ListItem>

            <ListItem
              button
              onClick={() => handleLinkClick("/library")}
              className={activeLink === "/library" ? "bg-gray-100" : ""}
            >
              <LibraryBooksIcon className="mr-3 text-[#111933]" />
              <ListItemText
                primary="LIBRARY"
                className={
                  activeLink === "/library"
                    ? "font-bold text-[#111933]"
                    : "text-[#111933]"
                }
              />
            </ListItem>

            <Divider className="my-2" />

            <ListItem
              button
              onClick={() => navigate("/mcq/details")}
              className="bg-gradient-to-r from-[#111933c9] to-[#111933] text-white my-2 mx-2 rounded"
            >
              <AddCircleOutlineIcon className="mr-3" />
              <ListItemText primary="CREATE TEST" />
            </ListItem>

            <Divider className="my-2" />

            <ListItem button onClick={handleSettings}>
              <AccountCircleIcon className="mr-3 text-[#111933]" />
              <ListItemText primary="Profile" className="text-[#111933]" />
            </ListItem>

            <ListItem button onClick={handleLogout}>
              <LogoutIcon className="mr-3 text-[#111933]" />
              <ListItemText primary="Logout" className="text-[#111933]" />
            </ListItem>
          </List>
        </div>
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleSettings}>
          <AccountCircleIcon className="mr-2" /> Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon className="mr-2" /> Logout
        </MenuItem>
      </Menu>

      <style jsx>{`
        .blinking-dot {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          background-color: #111933;
          border-radius: 50%;
          animation: blink 1.5s infinite;
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }

        @media (max-width: 1023px) {
          .blinking-dot {
            bottom: -5px;
            width: 6px;
            height: 6px;
          }
        }
      `}</style>
    </>
  );
};

export default StaffNavbar;