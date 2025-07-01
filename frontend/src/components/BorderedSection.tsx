import "./BorderedSection.css";
import classNames from "classnames";
import React from "react";
import { useDarkMode } from "./DarkMode";

const BorderedSection: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => {
    const { darkMode } = useDarkMode();
    const borderColor = darkMode ? 'yellow' : 'iris';

    return (
        <div className={classNames('bordered-section', className, borderColor)}>
            {children}
        </div>
    );
}

export default React.memo(BorderedSection);