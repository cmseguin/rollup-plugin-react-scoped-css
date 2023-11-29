import "./Sub.scoped.css";
import { FC } from "react";

export const Sub: FC<{ className: string }> = ({ className, ...props }) => {
  return (
    <div className={`sub ${className}`} {...props}>
      <h1>Sub</h1>
    </div>
  );
};
