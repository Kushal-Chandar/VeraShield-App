
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import IntensityControlComponent from "@/components/IntensityControl";

const IntensityControlPage = () => {
  const [intensity, setIntensity] = useState(50);
  const navigate = useNavigate();

  return (
    <div className="mobile-container bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <div className="container mx-auto px-4 py-6 max-w-md safe-area-inset">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate("/")}
            className="bg-white/80 backdrop-blur-sm border-0 shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Spray Intensity
            </h1>
            <p className="text-gray-600 text-sm">Adjust spray strength settings</p>
          </div>
        </div>

        {/* Intensity Control Component */}
        <IntensityControlComponent 
          intensity={intensity}
          onIntensityChange={setIntensity}
        />
      </div>
    </div>
  );
};

export default IntensityControlPage;
