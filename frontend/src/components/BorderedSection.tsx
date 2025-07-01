import classNames from "classnames";
import React from "react";
import { useDarkMode } from "./DarkMode";

const BorderedSection: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className }) => {
    const { darkMode } = useDarkMode();
    const borderColor = darkMode ? 'accent' : 'blue';

    return (
        <div className={classNames(`border-l-1 border-l-(--${borderColor}-5)`, className)}>
            {children}
        </div>
    );
}

export default React.memo(BorderedSection);