import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TimeSchedulerProps {
  sprayTime: string;
  onTimeChange: (time: string) => void;
}

interface ScheduleItem {
  time: string;
}

const TimeScheduler = ({ sprayTime, onTimeChange }: TimeSchedulerProps) => {
  const [isScheduleEnabled, setIsScheduleEnabled] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    { time: "08:00" },
    { time: "20:00" },
  ]);
  const [newTime, setNewTime] = useState("");
  const { toast } = useToast();

  const addSchedule = () => {
    if (newTime && !schedules.some((s) => s.time === newTime)) {
      const newSchedule: ScheduleItem = {
        time: newTime,
      };
      setSchedules([...schedules, newSchedule]);
      setNewTime("");
      toast({
        title: "Schedule Added",
        description: `Added spray at ${newSchedule.time}`,
      });
    }
  };

  const removeSchedule = (index: number) => {
    const removedSchedule = schedules[index];
    setSchedules(schedules.filter((_, i) => i !== index));
    toast({
      title: "Schedule Removed",
      description: `Removed spray time at ${removedSchedule.time}`,
    });
  };

  const nextSprayTime =
    [...schedules].sort((a, b) => a.time.localeCompare(b.time))[0]?.time || "No times set";

  return (
    <div className="space-y-6">
      {/* Schedule Settings */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Schedule Settings
          </CardTitle>
          <CardDescription>Set automatic spray times</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Schedule Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-teal-50 border">
            <div>
              <Label htmlFor="schedule-toggle" className="font-medium">
                Auto Schedule
              </Label>
              <p className="text-sm text-gray-600">Enable automatic spraying</p>
            </div>
            <Switch
              id="schedule-toggle"
              checked={isScheduleEnabled}
              onCheckedChange={setIsScheduleEnabled}
            />
          </div>

          {isScheduleEnabled && (
            <>
              {/* Current Schedules */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Active Schedules:</Label>
                <div className="space-y-2">
                  {schedules.map((schedule, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-teal-50 border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{schedule.time}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeSchedule(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add New Schedule */}
      {isScheduleEnabled && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Add New Schedule
            </CardTitle>
            <CardDescription>Create a new spray schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Time Input */}
            <div className="space-y-2">
              <Label htmlFor="new-time" className="text-sm font-medium">
                Spray Time:
              </Label>
              <Input
                id="new-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            {/* Add Button */}
            <Button
              onClick={addSchedule}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
              disabled={!newTime}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Next Spray Info */}
      {isScheduleEnabled && schedules.length > 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Next Spray</span>
            </div>
            <p className="text-sm text-blue-700">Scheduled for {nextSprayTime}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TimeScheduler;
