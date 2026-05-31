import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();
  useEffect(() => {
    // Don't scroll when user navigates back/forward - preserve their position
    if (navType === "POP") return;
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, navType]);
  return null;
};

export default ScrollToTop;
