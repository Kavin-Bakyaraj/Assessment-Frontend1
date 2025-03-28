import { useEffect, useState } from "react";
import { useTheme, useMediaQuery } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Make sure this is imported

const useDeviceRestriction = (contestId) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();
  const [openDeviceRestrictionModal, setOpenDeviceRestrictionModal] = useState(false);
  const [isDeviceAllowed, setIsDeviceAllowed] = useState(true);

  useEffect(() => {
    const applyDeviceRestriction = () => {
      // First try to get the setting from the currentTest object
      const currentTest = JSON.parse(localStorage.getItem("currentTest"));
      
      // Check if device restriction is enabled in currentTest
      const isDeviceRestrictionEnabled = currentTest?.deviceRestriction === true;
      
      // For backwards compatibility, also check the legacy setting
      const legacyDeviceRestriction = localStorage.getItem(`deviceRestriction_${contestId}`);
      
      // Use either setting (prioritize currentTest if available)
      const shouldRestrictDevice = isDeviceRestrictionEnabled || legacyDeviceRestriction === "true";
      
      if (shouldRestrictDevice && (isMobile || isTablet)) {
        setIsDeviceAllowed(false);
        setOpenDeviceRestrictionModal(true);
        
        // Show a warning alert with more information
        Swal.fire({
          icon: "warning",
          title: "Device Not Supported",
          text: "This test cannot be taken on a mobile or tablet device. Please use a desktop or laptop computer.",
          confirmButtonText: "Return to Dashboard",
          allowOutsideClick: false,
          allowEscapeKey: false,
          confirmButtonColor: "#111933",
        }).then(() => {
          navigate("/studentdashboard");
        });
      } else {
        setIsDeviceAllowed(true);
      }
    };

    applyDeviceRestriction();
  }, [contestId, isMobile, isTablet, navigate]);

  const handleDeviceRestrictionModalClose = () => {
    setOpenDeviceRestrictionModal(false);
    navigate("/studentdashboard");
  };

  return { 
    openDeviceRestrictionModal, 
    handleDeviceRestrictionModalClose,
    isDeviceAllowed 
  };
};

export default useDeviceRestriction;